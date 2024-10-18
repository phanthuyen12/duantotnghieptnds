#!/bin/bash
#
# Copyright IBM Corp All Rights Reserved
#
# SPDX-License-Identifier: Apache-2.0
#

# This script extends the Hyperledger Fabric test network by adding
# adding a new organization to the network

# prepending $PWD/../bin to PATH to ensure we are picking up the correct binaries
# this may be commented out to resolve installed version of tools if desired
export PATH=${PWD}/../../bin:${PWD}:$PATH
export FABRIC_CFG_PATH=${PWD}/../../config
export VERBOSE=false
  ORG_VALUE=$2
PORT_VALUE_CA=$3
. ../scripts/utils.sh

: ${CONTAINER_CLI:="docker"}
if command -v ${CONTAINER_CLI}-compose > /dev/null 2>&1; then
    : ${CONTAINER_CLI_COMPOSE:="${CONTAINER_CLI}-compose"}
else
    : ${CONTAINER_CLI_COMPOSE:="${CONTAINER_CLI} compose"}
fi
infoln "Using ${CONTAINER_CLI} and ${CONTAINER_CLI_COMPOSE}"

# Create Organization crypto material using cr ptogen or CAs
function generateOrg() {
  local org_value=$1
    local port_value_ca=$2
    
  # Create crypto material using cryptogen
  if [ "$CRYPTO" == "cryptogen" ]; then
    which cryptogen
    if [ "$?" -ne 0 ]; then
      fatalln "cryptogen tool not found. exiting"
    fi
    infoln "Generating certificates using cryptogen tool"

    infoln "Creating ${org_value} Identities"

    set -x
    cryptogen generate --config=org-crypto.yaml --output="../organizations"
    res=$?
    { set +x; } 2>/dev/null
    if [ $res -ne 0 ]; then
      fatalln "Failed to generate certificates..."
    fi

  fi

  # Create crypto material using Fabric CA
  if [ "$CRYPTO" == "Certificate Authorities" ]; then
    fabric-ca-client version > /dev/null 2>&1
    if [[ $? -ne 0 ]]; then
      echo "ERROR! fabric-ca-client binary not found.."
      echo
      echo "Follow the instructions in the Fabric docs to install the Fabric Binaries:"
      echo "https://hyperledger-fabric.readthedocs.io/en/latest/install.html"
      exit 1
    fi
echo "Organization value: $org_value"
echo "Port value CA: $port_value_ca"
    infoln "Generating certificates using Fabric CA"
    docker-compose -f compose/compose-org-ca.yaml up -d 2>&1

    . fabric-ca/registerEnroll.sh

    sleep 10

    infoln "Creating ${org_value} Identities"
    createOrg "$org_value" "$port_value_ca"

  fi

  # infoln "Generating CCP files for ${org_value}"
  # ./ccp-generate.sh "$ORG_VALUE" "$PORT_VALUE"  "$CA_PORT"
}

# Generate channel configuration transaction
function generateOrgDefinition() {
  local org_value=$1

  which configtxgen
  if [ "$?" -ne 0 ]; then
    fatalln "configtxgen tool not found. exiting"
  fi
  infoln "Generating ${org_value} organization definition"
  export FABRIC_CFG_PATH=$PWD
  set -x
  configtxgen -printOrg ${org_value}MSP > ../organizations/peerOrganizations/${org_value}.example.com/${org_value}.json
  res=$?
  { set +x; } 2>/dev/null
  if [ $res -ne 0 ]; then
    fatalln "Failed to generate ${org_value} organization definition..."
  fi

  infoln "Generating and submitting config tx to add ${org_value}"
  export FABRIC_CFG_PATH=${PWD}/../../config
  docker-compose -f compose/compose-org.yaml -f compose/docker/docker-compose-org.yaml up -d
  # docker-compose -f compose/compose-couch-org.yaml" up -d
  docker ps
}

function addOrg() {
  local org_value=$1

  if [ ! -d ../organizations/ordererOrganizations ]; then
    fatalln "ERROR: Please, run ./network.sh up createChannel first."
  fi

  if [ ! -d "../organizations/peerOrganizations/${org_value}.example.com" ]; then
    generateOrg "$org_value"
    generateOrgDefinition "$org_value"
  fi

  # . ../scripts/${org_value}-scripts/updateChannelConfig.sh $CHANNEL_NAME $CLI_DELAY $CLI_TIMEOUT $VERBOSE
  # if [ $? -ne 0 ]; then
  #   fatalln "ERROR !!!! Unable to create config tx"
  # fi

  # infoln "Joining ${org_value} peers to network"
  # . ../scripts/${org_value}-scripts/joinChannel.sh $CHANNEL_NAME $CLI_DELAY $CLI_TIMEOUT $VERBOSE
  if [ $? -ne 0 ]; then
    fatalln "ERROR !!!! Unable to join ${org_value} peers to network"
  fi
}

# Tear down running network
function networkDown () {
    cd ..
    ./network.sh down
}

# Using crpto vs CA. default is cryptogen
CRYPTO="cryptogen"
# timeout duration - the duration the CLI should wait for a response from
# another container before giving up
CLI_TIMEOUT=10
# default for delay
CLI_DELAY=3
# channel name defaults to "mychannel"
CHANNEL_NAME="mychannel"
# use this as the docker compose couch file
COMPOSE_FILE_COUCH_BASE=compose/compose-couch-${ORG_VALUE}.yaml
COMPOSE_FILE_COUCH_ORG=compose/${CONTAINER_CLI}/docker-compose-couch-${ORG_VALUE}.yaml
# use this as the default docker-compose yaml definition
COMPOSE_FILE_BASE=compose/compose-org.yaml
COMPOSE_FILE_ORG=compose/${CONTAINER_CLI}/docker-compose-org.yaml
# certificate authorities compose file
COMPOSE_FILE_CA_BASE=compose/compose-org-ca.yaml
echo "Port value CA: $COMPOSE_FILE_CA_BASE"

COMPOSE_FILE_CA_ORG=compose/${CONTAINER_CLI}/docker-compose-ca.yaml
# database
DATABASE="leveldb"

# Get docker sock path from environment variable
SOCK="${DOCKER_HOST:-/var/run/docker.sock}"
DOCKER_SOCK="${SOCK##unix://}"


## Parse mode
if [[ $# -lt 1 ]] ; then
  printHelp
  exit 0
else
  MODE=$1

  shift
fi

CRYPTO="Certificate Authorities"

# Determine whether starting, stopping, restarting or generating for announce

echo "Current mode: $MODE"
echo "Organization value: $ORG_VALUE"
echo "Port value CA: $PORT_VALUE_CA"

if [ "$MODE" == "up" ]; then
  echo "Generating certificates and organization definition..."
  generateOrg "$ORG_VALUE" "$PORT_VALUE_CA"
  generateOrgDefinition "$ORG_VALUE"
else
  printHelp
  exit 1
fi


