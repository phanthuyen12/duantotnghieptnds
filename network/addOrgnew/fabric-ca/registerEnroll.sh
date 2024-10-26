#!/bin/bash
#
# Copyright IBM Corp All Rights Reserved
#
# SPDX-License-Identifier: Apache-2.0
#

function createOrg {
    local org_value=$1
    local port_value_ca=$2
    echo "Organization: $org_value"
    echo "CA Port: $port_value_ca"
    
    echo "Enrolling the CA admin"
    mkdir -p ../organizations/peerOrganizations/${org_value}.example.com/

    export FABRIC_CA_CLIENT_HOME=${PWD}/../organizations/peerOrganizations/${org_value}.example.com/

    set -x
    fabric-ca-client enroll -u https://admin:adminpw@localhost:${port_value_ca} --caname ca-${org_value} --tls.certfiles "${PWD}/fabric-ca/${org_value}/tls-cert.pem"
    { set +x; } 2>/dev/null

echo "NodeOUs:
  Enable: true
  ClientOUIdentifier:
    Certificate: cacerts/localhost-${port_value_ca}-ca-${org_value}.pem
    OrganizationalUnitIdentifier: client
  PeerOUIdentifier:
    Certificate: cacerts/localhost-${port_value_ca}-ca-${org_value}.pem
    OrganizationalUnitIdentifier: peer
  AdminOUIdentifier:
    Certificate: cacerts/localhost-${port_value_ca}-ca-${org_value}.pem
    OrganizationalUnitIdentifier: admin
  OrdererOUIdentifier:
    Certificate: cacerts/localhost-${port_value_ca}-ca-${org_value}.pem
    OrganizationalUnitIdentifier: orderer" > "${PWD}/../organizations/peerOrganizations/${org_value}.example.com/msp/config.yaml"

    echo "Registering peer0"
    set -x
    fabric-ca-client register --caname ca-${org_value} --id.name peer0 --id.secret peer0pw --id.type peer --tls.certfiles "${PWD}/fabric-ca/${org_value}/tls-cert.pem"
    { set +x; } 2>/dev/null

    echo "Registering user"
    set -x
    fabric-ca-client register --caname ca-${org_value} --id.name user1 --id.secret user1pw --id.type client --tls.certfiles "${PWD}/fabric-ca/${org_value}/tls-cert.pem"
    { set +x; } 2>/dev/null

    echo "Registering the org admin"
    set -x
    fabric-ca-client register --caname ca-${org_value} --id.name ${org_value}admin --id.secret ${org_value}adminpw --id.type admin --tls.certfiles "${PWD}/fabric-ca/${org_value}/tls-cert.pem"
    { set +x; } 2>/dev/null

    echo "Generating the peer0 msp"
    set -x
    fabric-ca-client enroll -u https://peer0:peer0pw@localhost:${port_value_ca} --caname ca-${org_value} -M "${PWD}/../organizations/peerOrganizations/${org_value}.example.com/peers/peer0.${org_value}.example.com/msp" --tls.certfiles "${PWD}/fabric-ca/${org_value}/tls-cert.pem"
    { set +x; } 2>/dev/null

    cp "${PWD}/../organizations/peerOrganizations/${org_value}.example.com/msp/config.yaml" "${PWD}/../organizations/peerOrganizations/${org_value}.example.com/peers/peer0.${org_value}.example.com/msp/config.yaml"

    echo "Generating the peer0-tls certificates, use --csr.hosts to specify Subject Alternative Names"
    set -x
    fabric-ca-client enroll -u https://peer0:peer0pw@localhost:${port_value_ca} --caname ca-${org_value} -M "${PWD}/../organizations/peerOrganizations/${org_value}.example.com/peers/peer0.${org_value}.example.com/tls" --enrollment.profile tls --csr.hosts peer0.${org_value}.example.com --csr.hosts localhost --tls.certfiles "${PWD}/fabric-ca/${org_value}/tls-cert.pem"
    { set +x; } 2>/dev/null

    cp "${PWD}/../organizations/peerOrganizations/${org_value}.example.com/peers/peer0.${org_value}.example.com/tls/tlscacerts/"* "${PWD}/../organizations/peerOrganizations/${org_value}.example.com/peers/peer0.${org_value}.example.com/tls/ca.crt"
    cp "${PWD}/../organizations/peerOrganizations/${org_value}.example.com/peers/peer0.${org_value}.example.com/tls/signcerts/"* "${PWD}/../organizations/peerOrganizations/${org_value}.example.com/peers/peer0.${org_value}.example.com/tls/server.crt"
    cp "${PWD}/../organizations/peerOrganizations/${org_value}.example.com/peers/peer0.${org_value}.example.com/tls/keystore/"* "${PWD}/../organizations/peerOrganizations/${org_value}.example.com/peers/peer0.${org_value}.example.com/tls/server.key"

    mkdir -p "${PWD}/../organizations/peerOrganizations/${org_value}.example.com/msp/tlscacerts"
    cp "${PWD}/../organizations/peerOrganizations/${org_value}.example.com/peers/peer0.${org_value}.example.com/tls/tlscacerts/"* "${PWD}/../organizations/peerOrganizations/${org_value}.example.com/msp/tlscacerts/ca.crt"

    mkdir -p "${PWD}/../organizations/peerOrganizations/${org_value}.example.com/tlsca"
    cp "${PWD}/../organizations/peerOrganizations/${org_value}.example.com/peers/peer0.${org_value}.example.com/tls/tlscacerts/"* "${PWD}/../organizations/peerOrganizations/${org_value}.example.com/tlsca/tlsca.${org_value}.example.com-cert.pem"

    mkdir -p "${PWD}/../organizations/peerOrganizations/${org_value}.example.com/ca"
    cp "${PWD}/../organizations/peerOrganizations/${org_value}.example.com/peers/peer0.${org_value}.example.com/msp/cacerts/"* "${PWD}/../organizations/peerOrganizations/${org_value}.example.com/ca/ca.${org_value}.example.com-cert.pem"

    echo "Generating the user msp"
    set -x
    fabric-ca-client enroll -u https://user1:user1pw@localhost:${port_value_ca} --caname ca-${org_value} -M "${PWD}/../organizations/peerOrganizations/${org_value}.example.com/users/User1@${org_value}.example.com/msp" --tls.certfiles "${PWD}/fabric-ca/${org_value}/tls-cert.pem"
    { set +x; } 2>/dev/null

    cp "${PWD}/../organizations/peerOrganizations/${org_value}.example.com/msp/config.yaml" "${PWD}/../organizations/peerOrganizations/${org_value}.example.com/users/User1@${org_value}.example.com/msp/config.yaml"

    echo "Generating the org admin msp"
    set -x
    fabric-ca-client enroll -u https://${org_value}admin:${org_value}adminpw@localhost:${port_value_ca} --caname ca-${org_value} -M "${PWD}/../organizations/peerOrganizations/${org_value}.example.com/users/Admin@${org_value}.example.com/msp" --tls.certfiles "${PWD}/fabric-ca/${org_value}/tls-cert.pem"
    { set +x; } 2>/dev/null

    cp "${PWD}/../organizations/peerOrganizations/${org_value}.example.com/msp/config.yaml" "${PWD}/../organizations/peerOrganizations/${org_value}.example.com/users/Admin@${org_value}.example.com/msp/config.yaml"
}
