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
CORE_PEER_GOSSIP_USELEADERELECTION=true
CORE_PEER_GOSSIP_ORGLEADER=false

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

# Đường dẫn đến file collections_config.json
collections_config_path="../chaincode/OrgChaincode/collections_config.json"

# Đường dẫn đến file lichsu.txt
lichsu_path="./addOrgnew/lichsu.txt"

# Hàm đọc thông tin tổ chức từ file lichsu.txt
#!/bin/bash



# Hàm đọc thông tin tổ chức từ file lichsu.txt
read_org_info() {
    local file_path="$1"
    local org_names=()

    while IFS= read -r line; do
        # Lấy giá trị trước dấu hai chấm (:)
        org_name=$(echo "$line" | awk -F ':' '{print $1}' | xargs)
        if [[ -n "$org_name" ]]; then
            org_names+=("$org_name")
        fi
    done < "$file_path"

    echo "${org_names[@]}"
}

# Hàm tạo collection
create_private_collection() {
    local org_name="$1"
    if [[ -z "$org_name" || ! "$org_name" =~ ^[a-zA-Z0-9_]+$ ]]; then
        exit 1
    fi

    local collection_name="myPrivateCollection_$org_name"
    local policy="OR('Org1MSP.member', '${org_name}.member')"

    echo "{"
    echo "    \"name\": \"$collection_name\","
    echo "    \"policy\": \"$policy\","
    echo "    \"requiredPeerCount\": 1,"
    echo "    \"maxPeerCount\": 1,"
    echo "    \"blockToLive\": 0,"
    echo "    \"memberOnlyRead\": true"
    echo "}"
}

# Hàm ghi cấu hình collections vào file
write_collections_config() {
    local org_names=($(read_org_info "$lichsu_path"))
    if [ ${#org_names[@]} -eq 0 ]; then
        echo "Không tìm thấy tổ chức trong $lichsu_path."
        exit 1
    fi
    
    local collections=()

    # Tạo collection cho từng tổ chức trong lichsu.txt
    for org in "${org_names[@]}"; do
        # Gọi hàm create_private_collection để tạo từng collection
        collection=$(create_private_collection "$org")
        collections+=("$collection")
    done

    # Tạo thêm collection myPrivateCollection_Org1
    local additional_collection=$(create_private_collection "Org1")
    collections+=("$additional_collection")

    # Ghi lại vào file collections_config.json
    echo "[" > "$collections_config_path"
    
    for i in "${!collections[@]}"; do
        echo "${collections[$i]}" >> "$collections_config_path"
        if [[ $i -lt $((${#collections[@]} - 1)) ]]; then
            echo "," >> "$collections_config_path"
        fi
    done

    echo "]" >> "$collections_config_path"

    echo "Cấu hình collection đã được ghi vào file"
}

# Gọi hàm để ghi cấu hình collections
write_collections_config


# Đóng gói chaincode cho medical
# peer lifecycle chaincode package medical.tar.gz --path ../chaincode/MedicaChaincode --lang node --label medical_1.0.1

# Đóng gói chaincode cho organization
peer lifecycle chaincode package organization.tar.gz --path ../chaincode/OrgChaincode --lang node --label organization_1.0.1

# Cài đặt chaincode medical

# peer lifecycle chaincode install medical.tar.gz 



# Cài đặt chaincode organization
peer lifecycle chaincode install organization.tar.gz 

# Query installed chaincodes
peer lifecycle chaincode queryinstalled

# Approve chaincode for my org
# CC_PACKAGE_ID_MEDICAL=$(peer lifecycle chaincode queryinstalled | grep -oP '(?<=Package ID: ).*' | head -n 1 | cut -d ',' -f 1)
# echo "Package ID: $CC_PACKAGE_ID_MEDICAL"

lichsu_path="./addOrgnew/lichsu.txt"

# Hàm đọc thông tin tổ chức từ file lichsu.txt
read_org_infos() {
    local file_path="$1"
    local org_names=()

    while IFS= read -r line; do
        # Lấy giá trị trước dấu hai chấm (:)
        org_name=$(echo "$line" | awk -F ':' '{print $1}' | xargs)
        if [[ -n "$org_name" ]]; then
            org_names+=("$org_name")
        fi
    done < "$file_path"

    echo "${org_names[@]}"
}

# Hàm tạo chính sách chữ ký từ danh sách tổ chức
create_signature_policy() {
    local org_names=("$@")  # Lấy danh sách tổ chức làm tham số
    local policy=""

    for org in "${org_names[@]}"; do
        if [[ -n "$policy" ]]; then
            policy+=", "  # Thêm dấu phẩy nếu không phải tổ chức đầu tiên
        fi
        policy+="'${org}MSP.peer'"  # Thêm tổ chức vào chính sách với định dạng 'OrgXMSP.peer'
    done

    echo "AND($policy)"  # Trả về chính sách chữ ký
}

# Gọi hàm để lấy danh sách tổ chức
org_names=($(read_org_infos "$lichsu_path"))

# Tạo chính sách chữ ký
signature_policy=$(create_signature_policy "${org_names[@]}")
export CC_PACKAGE_ID_MEDICAL=medical_1.0.1:0f961af86c79af13b3582bd1d03bfd45d0434e8c71474ded44de4b1c42dcaf93
# peer lifecycle chaincode approveformyorg -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --tls --cafile "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem" --channelID "$NAMENETWORK" --name medical --version 1.0.1 --package-id $CC_PACKAGE_ID_MEDICAL --sequence 1 --signature-policy "${signature_policy}" --collection-config ../chaincode/OrgChaincode/collections_config.json

export CC_PACKAGE_ID_ORG=organization_1.0.1:abc5c6a6cd84e8f4d2b410dc3ad7f4bbc2227ba1b3883512187d51654d3cbf47
peer lifecycle chaincode approveformyorg -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --tls --cafile "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem" --channelID "$NAMENETWORK" --name organization --version 1.0.1 --package-id $CC_PACKAGE_ID_ORG --sequence 1 --signature-policy "${signature_policy}" --collection-config ../chaincode/OrgChaincode/collections_config.json

# Query committed chaincode
# peer lifecycle chaincode querycommitted --channelID "$NAMENETWORK" --name medical --signature-policy "${signature_policy}" --collection-config ../chaincode/OrgChaincode/collections_config.json
peer lifecycle chaincode querycommitted --channelID "$NAMENETWORK" --name organization --signature-policy "${signature_policy}" --collection-config ../chaincode/OrgChaincode/collections_config.json


# node apinetwork/enrollAdmin.js "${ORG_VALUE}"

# node apinetwork/registerUser.js "${ORG_VALUE}"


# node apinetwork/enrollAdmin.js "${ORG_VALUE}"

# node apinetwork/registerUser.js "${ORG_VALUE}"