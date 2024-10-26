#!/bin/bash

# Check if the correct number of arguments are provided
if [ "$#" -ne 3 ]; then
    echo "Usage: $0 <ORG> <P0PORT> <CAPORT>"
    exit 1
fi

ORG="$1"
P0PORT="$2"
CAPORT="$3"

echo "Organization: $ORG"
echo "Peer Port: $P0PORT"
echo "CA Port: $CAPORT"

# Function to convert PEM files to a single line format
function one_line_pem {
    echo "`awk 'NF {sub(/\\n/, ""); printf "%s\\\\\\\n",$0;}' $1`"
}

# Function to create JSON configuration file
function json_ccp {
    local PP=$(one_line_pem $4)
    local CP=$(one_line_pem $5)
    sed -e "s/\${ORG}/$1/" \
        -e "s/\${P0PORT}/$2/" \
        -e "s/\${CAPORT}/$3/" \
        -e "s#\${PEERPEM}#$PP#" \
        -e "s#\${CAPEM}#$CP#" \
        ccp-template.json
}

# Function to create YAML configuration file
function yaml_ccp {
    local PP=$(one_line_pem $4)
    local CP=$(one_line_pem $5)
    sed -e "s/\${ORG}/$1/" \
        -e "s/\${P0PORT}/$2/" \
        -e "s/\${CAPORT}/$3/" \
        -e "s#\${PEERPEM}#$PP#" \
        -e "s#\${CAPEM}#$CP#" \
        ccp-template.yaml | sed -e $'s/\\\\n/\\\n          /g'
}

# Paths to PEM files
PEERPEM=../organizations/peerOrganizations/${ORG}.example.com/tlsca/tlsca.${ORG}.example.com-cert.pem
CAPEM=../organizations/peerOrganizations/${ORG}.example.com/ca/ca.${ORG}.example.com-cert.pem

# Check if PEM files exist
if [ ! -f "$PEERPEM" ]; then
    echo "Peer PEM file does not exist: $PEERPEM"
    exit 1
fi

if [ ! -f "$CAPEM" ]; then
    echo "CA PEM file does not exist: $CAPEM"
    exit 1
fi

# Create JSON and YAML configuration files
JSON_OUTPUT="../organizations/peerOrganizations/${ORG}.example.com/connection-${ORG}.json"
YAML_OUTPUT="../organizations/peerOrganizations/${ORG}.example.com/connection-${ORG}.yaml"

echo "$(json_ccp $ORG $P0PORT $CAPORT $PEERPEM $CAPEM)" > $JSON_OUTPUT
echo "$(yaml_ccp $ORG $P0PORT $CAPORT $PEERPEM $CAPEM)" > $YAML_OUTPUT

# Check if configuration files are created and not empty
function check_file {
    local file=$1
    if [ ! -f "$file" ]; then
        echo "File not created: $file"
        exit 1
    fi

    if [ ! -s "$file" ]; then
        echo "File is empty: $file"
        exit 1
    fi
}

check_file $JSON_OUTPUT
check_file $YAML_OUTPUT

echo "Configuration files created successfully."
