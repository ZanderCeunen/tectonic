#!/usr/bin/env bash
# TECTONIC API & Document Upload Integration Test Script

API_URL="http://127.0.0.1:8080/api"

echo "================================================="
echo "🧪 Testing TECTONIC Backend API & Document Ingestion"
echo "================================================="

# 1. Health check
echo -e "\n1️⃣ Health Check:"
curl -s "${API_URL}/health"
echo ""

# 2. Add a new customer
echo -e "\n2️⃣ Creating a new Customer (POST /api/customers):"
curl -s -X POST "${API_URL}/customers" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "CUST-004",
    "name": "Vanderlaan Transport NV",
    "enterprise_number": "BE 0987.654.321",
    "industry": "Transport & Logistiek",
    "joint_committee": "PC 200 - Bedienden",
    "primary_contact": "Jan Vanderlaan (COO)",
    "contact_email": "jan@vanderlaan.be",
    "employee_count": 85,
    "location": "Gent Zeehaven"
  }' | json_pp 2>/dev/null || curl -s -X POST "${API_URL}/customers" -H "Content-Type: application/json" -d '{"id":"CUST-004","name":"Vanderlaan Transport NV","enterprise_number":"BE 0987.654.321","industry":"Transport","joint_committee":"PC 200","primary_contact":"Jan","contact_email":"jan@be.be","employee_count":85,"location":"Gent"}'

# 3. Add a new document with Base64 File Upload
echo -e "\n\n3️⃣ Ingesting Document with Physical File Upload (POST /api/documents):"
# Demo PDF text base64 encoded ("SGVsbG8gU0QgV29yeCEgRGl0IGlzIGVlbiB0ZXN0IGJlc3RhbmQu")
B64_DATA="SGVsbG8gU0QgV29yeCEgRGl0IGlzIGVlbiB0ZXN0IGJlc3RhbmQu"

curl -s -X POST "${API_URL}/documents" \
  -H "Content-Type: application/json" \
  -d "{
    \"customer_id\": \"CUST-001\",
    \"title\": \"Bijlage Arbeidsovereenkomst Flexwerk 2026\",
    \"source_type\": \"SignedContract\",
    \"author\": \"Sarah Vermeulen & SD Worx Legal\",
    \"summary\": \"Officieel medeondertekende overeenkomst inzake 38u/week werkregime en tijdsregistratie.\",
    \"raw_content\": \"Artikel 1: Het wekelijks werkregime voor Vanderlaan Transport is vastgesteld op 38u/week. Telewerk max 2 dagen per week.\",
    \"file_name\": \"addendum_flexwerk_2026.pdf\",
    \"file_base64\": \"${B64_DATA}\",
    \"key_facts\": [
      { \"field\": \"werkregime\", \"label\": \"Wekelijks Werkregime\", \"value\": \"38u/week\", \"is_conflicting\": false }
    ],
    \"tags\": [\"Contract\", \"Flexwerk\", \"PC 200\"]
  }"

# 4. List documents for customer
echo -e "\n\n4️⃣ Retrieving Documents for CUST-001 (GET /api/customers/CUST-001/documents):"
curl -s "${API_URL}/customers/CUST-001/documents"

# 5. Check Audit Ledger
echo -e "\n\n5️⃣ Verifying SHA-256 Audit Chain (GET /api/security/audit-chain):"
curl -s "${API_URL}/security/audit-chain"

echo -e "\n\n✅ Test Script Afgerond!"
