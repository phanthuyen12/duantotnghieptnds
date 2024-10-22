#!/bin/bash

# Hàm để xử lý lỗi
error_exit() {
    echo "Error on line $1"
    exit 1
}
source ../sever-managent/.env
# Trap lỗi và gọi hàm error_exit
echo "Giá trị biến MY_VARIABLE là: $NAMENETWORK"
trap 'error_exit $LINENO' ERR
SCRIPT_DIR=$(dirname "$(realpath "$0")")

LOG_FILE="${SCRIPT_DIR}/logfile.txt"
exec > >(tee -a $LOG_FILE) 2>&1

# Nhận giá trị tổ chức từ tham số đầu vào
ORG_VALUE="$1"
SCRIPT_PATH_CHECK=$(realpath "$0")
echo "Script path: $SCRIPT_PATH_CHECK"

# Kiểm tra tham số đầu vào
if [ -z "$ORG_VALUE" ]; then
    echo "Organization value is required."
    exit 1
fi

cd ${SCRIPT_DIR}/addOrgnew
ls



# Tạo các tệp cần thiết cho tổ chức mới

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
# ../../bin/cryptogen generate --config=org-crypto.yaml --output="../organizations"
export DOCKER_SOCK=/var/run/docker.sock

./addOrgnew.sh up "${ORG_VALUE}" "${CA_PORT}"
# docker-compose -f compose/compose-org-ca.yaml up -d
# đăng ký ca cho tổ chức mới 


# export FABRIC_CFG_PATH=$PWD
# ../../bin/configtxgen -printOrg ${ORG_VALUE}MSP > ../organizations/peerOrganizations/${ORG_VALUE}.example.com/${ORG_VALUE}.json

# docker-compose -f compose/compose-org.yaml -f compose/docker/docker-compose-org.yaml up -d
./ccp-generate.sh "$ORG_VALUE" "$PORT_VALUE"  "$CA_PORT"

#  cd ..
cd ${SCRIPT_DIR}

# Thiết lập các biến môi trường
export PATH=${PWD}/../bin:$PATH
export FABRIC_CFG_PATH=${PWD}/../config/
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID="Org1MSP"
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
export CORE_PEER_ADDRESS=localhost:7051
# Fetch và decode config block
echo "Fetching the config block for channel '"$NAMENETWORK"'..."
peer channel fetch config channel-artifacts/config_block.pb -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com -c "$NAMENETWORK" --tls --cafile "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem"

echo "Changing directory to ${SCRIPT_DIR}/channel-artifacts..."
cd ${SCRIPT_DIR}/channel-artifacts

echo "Decoding the config block..."
configtxlator proto_decode --input config_block.pb --type common.Block --output config_block.json
jq ".data.data[0].payload.data.config" config_block.json > config.json

echo "Modifying the config with organization '${ORG_VALUE}'..."
jq -s '.[0] * {"channel_group":{"groups":{"Application":{"groups": {"'${ORG_VALUE}'MSP":.[1]}}}}}' config.json ../organizations/peerOrganizations/${ORG_VALUE}.example.com/${ORG_VALUE}.json > modified_config.json

echo "Encoding the original and modified configs..."

configtxlator proto_encode --input config.json --type common.Config --output config.pb
configtxlator proto_encode --input modified_config.json --type common.Config --output modified_config.pb

echo "Computing the update between original and modified config..."
configtxlator compute_update --channel_id "$NAMENETWORK" --original config.pb --updated modified_config.pb --output ${ORG_VALUE}_update.pb

echo "Decoding the computed update..."
configtxlator proto_decode --input ${ORG_VALUE}_update.pb --type common.ConfigUpdate --output ${ORG_VALUE}_update.json

echo "Creating the update envelope..."
echo '{"payload":{"header":{"channel_header":{"channel_id":"'"$NAMENETWORK"'", "type":2}},"data":{"config_update":'$(cat ${ORG_VALUE}_update.json)'}}}' | jq . > ${ORG_VALUE}_update_in_envelope.json

echo "Encoding the update envelope into protobuf format..."
configtxlator proto_encode --input ${ORG_VALUE}_update_in_envelope.json --type common.Envelope --output ${ORG_VALUE}_update_in_envelope.pb

echo "Changing directory back to ${SCRIPT_DIR}/network..."
cd ${SCRIPT_DIR}
peer channel signconfigtx -f channel-artifacts/${ORG_VALUE}_update_in_envelope.pb

echo "Signing the config update..."



export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID="Org2MSP"
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org2.example.com/users/Admin@org2.example.com/msp
export CORE_PEER_ADDRESS=localhost:9051
peer channel signconfigtx -f channel-artifacts/${ORG_VALUE}_update_in_envelope.pb
# peer channel update -f channel-artifacts/${ORG_VALUE}_update_in_envelope.pb -c "$NAMENETWORK" -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --tls --cafile "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem"

HISTORY_FILE="${SCRIPT_DIR}/addOrgnew/lichsu.txt"
while IFS=: read -r value1 value2; do
    echo "Value 1: $value1"
    echo "Value 2: $value2"
    export CORE_PEER_TLS_ENABLED=true
    export CORE_PEER_LOCALMSPID="${value1}MSP"
    export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/${value1}.example.com/peers/peer0.${value1}.example.com/tls/ca.crt
    export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/${value1}.example.com/users/Admin@${value1}.example.com/msp
    export CORE_PEER_ADDRESS=localhost:${value2}

    peer channel signconfigtx -f channel-artifacts/${ORG_VALUE}_update_in_envelope.pb

done < "$HISTORY_FILE"

if [ -s "$HISTORY_FILE" ]; then
    echo "${ORG_VALUE}:${PORT_VALUE}" >> "$HISTORY_FILE"
    echo "Saved '${ORG_VALUE}:${PORT_VALUE}' to $HISTORY_FILE"
else
    echo "${ORG_VALUE}:${PORT_VALUE}" > "$HISTORY_FILE"
    echo "Created $HISTORY_FILE and saved '${ORG_VALUE}:${PORT_VALUE}'"
fi

peer channel update -f channel-artifacts/${ORG_VALUE}_update_in_envelope.pb -c "$NAMENETWORK" -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --tls --cafile "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem"

export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID="${ORG_VALUE}MSP"
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/${ORG_VALUE}.example.com/peers/peer0.${ORG_VALUE}.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/${ORG_VALUE}.example.com/users/Admin@${ORG_VALUE}.example.com/msp
export CORE_PEER_ADDRESS=localhost:${PORT_VALUE}
peer channel fetch 0 channel-artifacts/"$NAMENETWORK".block -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com -c "$NAMENETWORK" --tls --cafile "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem"
peer channel join -b channel-artifacts/"$NAMENETWORK".block



# Optional: Change gossip leader election settings
CORE_PEER_GOSSIP_USELEADERELECTION=false
CORE_PEER_GOSSIP_ORGLEADER=true
# CORE_PEER_GOSSIP_USELEADERELECTION=true
# CORE_PEER_GOSSIP_ORGLEADER=false

# Deploy chaincode
# HISTORY_FILE="/home/phangiathuyen/codeduantotnghiep/duantotnghiep/sever/network/addOrgnew/lichsu.txt"
# # HISTORY_FILE="addOrgnew/lichsu.txt"

# # Kiểm tra nếu file có dữ liệu
# if [ -s "$HISTORY_FILE" ]; then
#     # Lưu giá trị vào file, mỗi lần lưu là một hàng mới
#     echo "${ORG_VALUE}:${PORT_VALUE}" >> "$HISTORY_FILE"
#     echo "Saved '${ORG_VALUE}:${PORT_VALUE}' to $HISTORY_FILE"
# else
#     # Nếu file trống hoặc không tồn tại, tạo file và lưu giá trị đầu tiên
#     echo "${ORG_VALUE}:${PORT_VALUE}" > "$HISTORY_FILE"
#     echo "Created $HISTORY_FILE and saved '${ORG_VALUE}:${PORT_VALUE}'"
# fi

# Install chaincode
export PATH=${PWD}/../bin:$PATH
export FABRIC_CFG_PATH=$PWD/../config/
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID="${ORG_VALUE}MSP"
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/${ORG_VALUE}.example.com/peers/peer0.${ORG_VALUE}.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/${ORG_VALUE}.example.com/users/Admin@${ORG_VALUE}.example.com/msp
export CORE_PEER_ADDRESS=localhost:${PORT_VALUE}

# ./network.sh deployCC -ccn testmedica -ccp ../chaincode/testMedicaChaincode -ccl javascript -c "$NAMENETWORK"

# Đóng gói chaincode cho medical
peer lifecycle chaincode package medical.tar.gz --path ../chaincode/MedicaChaincode --lang node --label medical_1.0

# Đóng gói chaincode cho organization
peer lifecycle chaincode package organization.tar.gz --path ../chaincode/OrgChaincode --lang node --label organization_1.0

# Cài đặt chaincode medical
peer lifecycle chaincode install medical.tar.gz 

# Cài đặt chaincode organization
peer lifecycle chaincode install organization.tar.gz 

# Query installed chaincodes
peer lifecycle chaincode queryinstalled

# Approve chaincode for my org
# CC_PACKAGE_ID_MEDICAL=$(peer lifecycle chaincode queryinstalled | grep -oP '(?<=Package ID: ).*' | head -n 1 | cut -d ',' -f 1)
# echo "Package ID: $CC_PACKAGE_ID_MEDICAL"
export CC_PACKAGE_ID_MEDICAL=medical_1.0:2e6685adadd3103938f17f788410e1861d23cd205bb180801e659debca1d1c32
peer lifecycle chaincode approveformyorg -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --tls --cafile "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem" --channelID "$NAMENETWORK" --name medical --version 1.0 --package-id $CC_PACKAGE_ID_MEDICAL --sequence 1


export CC_PACKAGE_ID_ORG=organization_1.0:6e0fdd6b1c76e082a3322eae100ca9174981dcf3037f89c72c479ca81b9e18fc
peer lifecycle chaincode approveformyorg -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --tls --cafile "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem" --channelID "$NAMENETWORK" --name organization --version 1.0 --package-id $CC_PACKAGE_ID_ORG --sequence 1

# Query committed chaincode
peer lifecycle chaincode querycommitted --channelID "$NAMENETWORK" --name medical
peer lifecycle chaincode querycommitted --channelID "$NAMENETWORK" --name organization


# node apinetwork/enrollAdmin.js "${ORG_VALUE}"

# node apinetwork/registerUser.js "${ORG_VALUE}"