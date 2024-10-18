#!/bin/bash

# Tên tổ chức (có thể lấy từ tham số dòng lệnh hoặc cài đặt trước)
ORG_NAME=${1:-org3}
PORT_CLIENT=${2}
PORT_CHANECODE=${3}
PORT_CA=${4}

# Các file Docker Compose mẫu

TEMPLATE_COMPOSE_FILE_BASE="template/compose-org.yaml"
TEMPLATE_COMPOSE_FILE_ORG="template/docker-compose-org.yaml"
TEMPLATE_COMPOSE_FILE_ORG_CA="template/compose-org-ca.yaml"
TEMPLATE_CONFIG_CA_SERVER="template/fabric-ca-server-config.yaml"
TEMPLATE_CONFIG="template/configtx.yaml"
TEMPLATE_CRYPTO="template/org-crypto.yaml"
TEMPLATE_COMPOSE_DOCKER_FILE_ORG_CA="template/docker-compose-ca.yaml"
TEMPLATE_COMPOSE_COUCH_ORG="template/compose-couch-org.yaml"
TEMPLATE_PODMAN_COUCH_ORG="template/podman-compose-couch-org"


# Các file đích

COMPOSE_FILE_BASE="compose/compose-org.yaml"
COMPOSE_FILE_BASE_CA="compose/compose-org-ca.yaml"

COMPOSE_CONFIG="configtx.yaml"

COMPOSE_FILE_ORG_DOCKER="compose/docker/docker-compose-org.yaml"
COMPOSE_FILE_ORG_DOCKER_CA="compose/docker/docker-compose-ca.yaml"

COMPOSE_CRYPTO="org-crypto.yaml"

CONFIG_CA_SERVER="fabric-ca/${ORG_NAME}/fabric-ca-server-config.yaml"

COMPOSE_COUCH_ORG="compose/compose-couch-org.yaml"


# Tạo thư mục đích nếu chưa tồn tại
mkdir -p "$(dirname $COMPOSE_FILE_BASE)"
mkdir -p "$(dirname $COMPOSE_FILE_BASE_CA)"
mkdir -p "$(dirname $COMPOSE_CONFIG)"
mkdir -p "$(dirname $COMPOSE_FILE_ORG_DOCKER)"
mkdir -p "$(dirname $COMPOSE_CRYPTO)"
mkdir -p "$(dirname $CONFIG_CA_SERVER)"
mkdir -p "$(dirname $COMPOSE_FILE_ORG_DOCKER_CA)"
mkdir -p "$(dirname $COMPOSE_COUCH_ORG)"

# Thay thế biến và lưu vào các file đích
sed -e "s/\${ORG_NAME}/${ORG_NAME}/g" \
    -e "s/\${PORT_CLIENT}/${PORT_CLIENT}/g" \
    -e "s/\${PORT_CHANECODE}/${PORT_CHANECODE}/g" \
 $TEMPLATE_COMPOSE_FILE_BASE > $COMPOSE_FILE_BASE
sed -e "s/\${ORG_NAME}/${ORG_NAME}/g" \
    -e "s/\${PORT_CA}/${PORT_CA}/g" \
 $TEMPLATE_COMPOSE_FILE_ORG_CA > $COMPOSE_FILE_BASE_CA
sed "s/\${ORG_NAME}/${ORG_NAME}/g" $TEMPLATE_CONFIG > $COMPOSE_CONFIG
sed "s/\${ORG_NAME}/${ORG_NAME}/g" $TEMPLATE_COMPOSE_FILE_ORG > $COMPOSE_FILE_ORG_DOCKER
sed "s/\${ORG_NAME}/${ORG_NAME}/g" $TEMPLATE_CRYPTO > $COMPOSE_CRYPTO
sed -e "s/\${ORG_NAME}/${ORG_NAME}/g" \
    -e "s/\${PORT_CA}/${PORT_CA}/g" \
 $TEMPLATE_CONFIG_CA_SERVER > $CONFIG_CA_SERVER

# sed -e "s/\${ORG_NAME}/${ORG_NAME}/g" \
#     -e "s/\${PORT_CA}/${PORT_CA}/g" \
#  $TEMPLATE_COMPOSE_DOCKER_FILE_ORG_CA > $COMPOSE_FILE_ORG_DOCKER_CA
# Cập nhật giá trị port mới

