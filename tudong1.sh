#!/bin/bash

# Hàm để xử lý lỗi
error_exit() {
    echo "Error on line $1"
    exit 1
}

# Trap lỗi và gọi hàm error_exit
trap 'error_exit $LINENO' ERR

# Nhận giá trị tổ chức từ tham số đầu vào
ORG_VALUE="$1"

# Kiểm tra tham số đầu vào
if [ -z "$ORG_VALUE" ]; then
    echo "Organization value is required."
    exit 1
fi

# Tạo các tệp cần thiết cho tổ chức mới
cd addOrgnew

# Đọc giá trị cổng và giảm đi 1
PORT_VALUE1="valueport.txt"
PORT_VALUE_REG=$(cat "$PORT_VALUE1")
PORT_VALUE=$((PORT_VALUE_REG + 1))
PORT_CLIENT=$((PORT_VALUE_REG + 2))
CA_PORT=$((PORT_VALUE_REG + 3))
PORT_MD=$((PORT_VALUE_REG + 4))

echo "$PORT_MD" > valueport.txt

echo "Docker compose files created for ${ORG_NAME}"
./generate-files.sh $ORG_VALUE $PORT_VALUE $PORT_CLIENT $CA_PORT




# Tạo các tệp cấu hình và cập nhật tổ chức
../../bin/cryptogen generate --config=org-crypto.yaml --output="../organizations"

export FABRIC_CFG_PATH=$PWD
../../bin/configtxgen -printOrg ${ORG_VALUE}MSP > ../organizations/peerOrganizations/${ORG_VALUE}.example.com/${ORG_VALUE}.json

export DOCKER_SOCK=/var/run/docker.sock

docker-compose -f compose/compose-org.yaml -f compose/docker/docker-compose-org.yaml up -d
./ccp-generate.sh "$ORG_VALUE" "$PORT_VALUE"  "$CA_PORT"
docker-compose -f compose/compose-org-ca.yaml up -d

cd ..

# Thiết lập các biến môi trường
export PATH=${PWD}/../bin:$PATH
export FABRIC_CFG_PATH=${PWD}/../config/
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID=Org1MSP
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
export CORE_PEER_ADDRESS=localhost:7051

# Fetch và decode config block
peer channel fetch config channel-artifacts/config_block.pb -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com -c channel1 --tls --cafile "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem"

cd channel-artifacts
configtxlator proto_decode --input config_block.pb --type common.Block --output config_block.json
jq ".data.data[0].payload.data.config" config_block.json > config.json

# Modify config và encode
jq -s '.[0] * {"channel_group":{"groups":{"Application":{"groups": {"'${ORG_VALUE}'MSP":.[1]}}}}}' config.json ../organizations/peerOrganizations/${ORG_VALUE}.example.com/${ORG_VALUE}.json > modified_config.json
sleep 1
configtxlator proto_encode --input config.json --type common.Config --output config.pb
sleep 1
configtxlator proto_encode --input modified_config.json --type common.Config --output modified_config.pb
sleep 1
configtxlator compute_update --channel_id channel1 --original config.pb --updated modified_config.pb --output ${ORG_VALUE}_update.pb
sleep 1
configtxlator proto_decode --input ${ORG_VALUE}_update.pb --type common.ConfigUpdate --output ${ORG_VALUE}_update.json
sleep 1
echo '{"payload":{"header":{"channel_header":{"channel_id":"channel1", "type":2}},"data":{"config_update":'$(cat ${ORG_VALUE}_update.json)'}}}' | jq . > ${ORG_VALUE}_update_in_envelope.json
sleep 1
configtxlator proto_encode --input ${ORG_VALUE}_update_in_envelope.json --type common.Envelope --output ${ORG_VALUE}_update_in_envelope.pb
sleep 1

cd ..
peer channel signconfigtx -f channel-artifacts/${ORG_VALUE}_update_in_envelope.pb

# Update channel config
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID=Org2MSP
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org2.example.com/users/Admin@org2.example.com/msp
export CORE_PEER_ADDRESS=localhost:9051
sleep 1
peer channel signconfigtx -f channel-artifacts/${ORG_VALUE}_update_in_envelope.pb
HISTORY_FILE="addOrgnew/lichsu.txt"

while IFS=: read -r value1 value2; do
    # In giá trị đã tách ra
    echo "Value 1: $value1"
    echo "Value 2: $value2"

    export CORE_PEER_TLS_ENABLED=true
    export CORE_PEER_LOCALMSPID=${value1}MSP
    export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/${value1}.example.com/peers/peer0.${value1}.example.com/tls/ca.crt
    export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/${value1}.example.com/users/Admin@${value1}.example.com/msp
    export CORE_PEER_ADDRESS=localhost:${value2}
    sleep 1
    peer channel signconfigtx -f channel-artifacts/${value1}_update_in_envelope.pb
done < "$HISTORY_FILE"




# Update channel configuration
peer channel update -f channel-artifacts/${ORG_VALUE}_update_in_envelope.pb -c channel1 -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --tls --cafile "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem"
sleep 2

# Join new peer to channel
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID=${ORG_VALUE}MSP
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/${ORG_VALUE}.example.com/peers/peer0.${ORG_VALUE}.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/${ORG_VALUE}.example.com/users/Admin@${ORG_VALUE}.example.com/msp
export CORE_PEER_ADDRESS=localhost:${PORT_VALUE}
sleep 1
peer channel fetch 0 channel-artifacts/channel1.block -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com -c channel1 --tls --cafile "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem"
sleep 1
peer channel join -b channel-artifacts/channel1.block

# Optional: Change gossip leader election settings
CORE_PEER_GOSSIP_USELEADERELECTION=false
CORE_PEER_GOSSIP_ORGLEADER=true
CORE_PEER_GOSSIP_USELEADERELECTION=true
CORE_PEER_GOSSIP_ORGLEADER=false

# Deploy chaincode
HISTORY_FILE="addOrgnew/lichsu.txt"

# Kiểm tra nếu file có dữ liệu
if [ -s "$HISTORY_FILE" ]; then
    # Lưu giá trị vào file, mỗi lần lưu là một hàng mới
    echo "${ORG_VALUE}:${PORT_VALUE}" >> "$HISTORY_FILE"
    echo "Saved '${ORG_VALUE}:${PORT_VALUE}' to $HISTORY_FILE"
else
    # Nếu file trống hoặc không tồn tại, tạo file và lưu giá trị đầu tiên
    echo "${ORG_VALUE}:${PORT_VALUE}" > "$HISTORY_FILE"
    echo "Created $HISTORY_FILE and saved '${ORG_VALUE}:${PORT_VALUE}'"
fi

# Install chaincode
export PATH=${PWD}/../bin:$PATH
export FABRIC_CFG_PATH=$PWD/../config/
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID=${ORG_VALUE}MSP
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/${ORG_VALUE}.example.com/peers/peer0.${ORG_VALUE}.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/${ORG_VALUE}.example.com/users/Admin@${ORG_VALUE}.example.com/msp
export CORE_PEER_ADDRESS=localhost:${PORT_VALUE}

peer lifecycle chaincode package hospital.tar.gz --path ../chaincode/HospitalChaincode --lang node --label hospital_1.0.1
peer lifecycle chaincode package users.tar.gz --path ../chaincode/UserChaincode --lang node --label users_1.0.1
peer lifecycle chaincode install hospital.tar.gz 

# Query installed chaincodes
peer lifecycle chaincode queryinstalled

# Approve chaincode for my org
export CC_PACKAGE_ID_HOSPITAL=hospital_1.0.1:feb636279d43b23fb83f43882749b2176feb3250ff5f5c941dbfcfa9eafe50a0
export CC_PACKAGE_ID_USERS=users_1.0.1:0599d9c6792e86bb9f9e588be0ffec6ea35871d7aeb69ffca148cfb366fa48bf
peer lifecycle chaincode approveformyorg -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --tls --cafile "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem" --channelID channel1 --name hospital --version 1.0.1 --package-id $CC_PACKAGE_ID_HOSPITAL --sequence 1
peer lifecycle chaincode approveformyorg -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --tls --cafile "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem" --channelID channel1 --name users --version 1.0.1 --package-id $CC_PACKAGE_ID_USERS --sequence 1

# Query committed chaincode
peer lifecycle chaincode querycommitted --channelID channel1 --name hospital
peer lifecycle chaincode querycommitted --channelID channel1 --name users


# node apinetwork/enrollAdmin.js "${ORG_VALUE}"

# node apinetwork/registerUser.js "${ORG_VALUE}"