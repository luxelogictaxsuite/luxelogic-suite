#!/usr/bin/env bash
# Break-in tests for the LuxeLogic security rules.
# Usage: PSQL="psql -h HOST -p PORT -U postgres -d DBNAME" ./security_test.sh
# Run against a THROWAWAY database that already has the migration applied
# (never against production — it inserts test users and records).
set -u
P="${PSQL:?set PSQL to a psql command for a throwaway database} -q -At"

$P <<'EOF' >/dev/null
insert into auth.users(id,email) values
 ('00000000-0000-0000-0000-00000000000a','liyah@luxelogic.test'),
 ('00000000-0000-0000-0000-00000000000b','prepA@test.com'),
 ('00000000-0000-0000-0000-00000000000c','prepB@test.com');
update public.profiles set role='admin' where email='liyah@luxelogic.test';
insert into public.preparers(id,name,email,comp_tier,phone) values
 ('pA','Prep A','PrepA@test.com','70/30','111'),('pB','Prep B','prepB@test.com','80/20','222');
insert into public.form_definitions(id,name,category,fields,form_status) values
 ('fIntake','2026 Client Intake','Tax Clients','[]','accepting'),('fClosed','Old Form','General','[]','closed');
insert into public.form_submissions(id,form_definition_id,form_name,submission_data) values
 ('sA','fIntake','2026 Client Intake','{"ssn":"123"}'),('sB','fIntake','2026 Client Intake','{"ssn":"456"}');
insert into public.client_assignments(id,client_name,preparer_email,preparer_name,form_submission_id) values
 ('aA','Client of A','prepa@test.com','Prep A','sA'),('aB','Client of B','prepB@test.com','Prep B','sB');
EOF

ADMIN='{"sub":"00000000-0000-0000-0000-00000000000a","email":"liyah@luxelogic.test"}'
A='{"sub":"00000000-0000-0000-0000-00000000000b","email":"prepA@test.com"}'
pass=0; fail=0

# t "label" ROLE CLAIMS "sql" EXPECT   (EXPECT = blocked | ok | <exact value>)
t() {
  out=$($P -c "begin; set local role $2; do \$\$ begin perform set_config('request.jwt.claims','$3',true); end \$\$;" -c "$4" -c "commit;" 2>&1)
  last=$(printf '%s\n' "$out" | grep -v '^$' | grep -vE '^(BEGIN|COMMIT|SET)$' | tail -1)
  case "$5" in
    blocked) [[ "$out" == *ERROR* && "$out" != *"syntax error"* && "$out" != *"does not exist"* ]] && r=PASS || r=FAIL ;;
    ok)      [[ "$out" != *ERROR* ]] && r=PASS || r=FAIL ;;
    *)       [[ "$out" != *ERROR* && "$last" == "$5" ]] && r=PASS || r=FAIL ;;
  esac
  [[ $r == PASS ]] && pass=$((pass+1)) || fail=$((fail+1))
  msg=$(printf '%s\n' "$out" | grep -m1 ERROR || printf '%s' "$last")
  printf "%-4s %-44s -> %s\n" "$r" "$1" "${msg:0:90}"
}
upd() { echo "with u as ($1 returning 1) select count(*) from u"; }  # rows actually changed

echo "== Logged-out visitor =="
t "can't see any client returns"            anon '{}' "select count(*) from client_assignments" blocked
t "can't read intake submissions (SSNs)"    anon '{}' "select count(*) from form_submissions" 0
t "CAN submit an intake form"               anon '{}' "insert into form_submissions(form_definition_id,submission_data) values ('fIntake','{}')" ok
t "can't submit to a CLOSED form"           anon '{}' "insert into form_submissions(form_definition_id,submission_data) values ('fClosed','{}')" blocked
t "can't submit a purchase marked as paid"  anon '{}' "insert into software_purchases(full_name,email,paid,amount_paid) values ('x','x@x',true,497)" blocked
t "CAN submit a normal purchase lead"       anon '{}' "insert into software_purchases(full_name,email) values ('x','x@x')" ok
t "CAN upload to intake folder"             anon '{}' "insert into storage.objects(bucket_id,name) values ('private-uploads','intake/w2.pdf')" ok
t "can't upload outside intake folder"      anon '{}' "insert into storage.objects(bucket_id,name) values ('private-uploads','other/x.pdf')" blocked
t "can't read uploaded docs back"           anon '{}' "select count(*) from storage.objects" 0

echo "== Preparer A =="
t "sees ONLY own returns (1 of 2)"          authenticated "$A" "select count(*) from client_assignments" 1
t "sees ONLY own client's intake"           authenticated "$A" "select string_agg(id,',') from form_submissions" sA
t "can't make themselves admin"             authenticated "$A" "$(upd "update profiles set role='admin' where email='prepa@test.com'")" 0
t "can't change own comp tier to 80/20"     authenticated "$A" "update preparers set comp_tier='80/20' where id='pA'" blocked
t "can't reactivate/deactivate self"        authenticated "$A" "update preparers set active=false where id='pA'" blocked
t "CAN update own unlocked field"           authenticated "$A" "$(upd "update preparers set ptin='P0001' where id='pA'")" 1
t "can't mark own return Filed"             authenticated "$A" "update client_assignments set status='Filed' where id='aA'" blocked
t "can't mark own return Funded"            authenticated "$A" "update client_assignments set status='Funded' where id='aA'" blocked
t "CAN mark Ready for Review + enter fee"   authenticated "$A" "$(upd "update client_assignments set status='Ready for Review', return_fee=800 where id='aA'")" 1
t "can't reassign return to another prep"   authenticated "$A" "update client_assignments set preparer_email='prepb@test.com' where id='aA'" blocked
t "can't create a fake earning"             authenticated "$A" "insert into earnings(client_name,preparer_email,return_fee,preparer_share) values ('x','prepA@test.com',5000,5000)" blocked
t "can't see or edit B's return"            authenticated "$A" "$(upd "update client_assignments set notes='hi' where id='aB'")" 0
t "can't add doc request to B's client"     authenticated "$A" "insert into document_requests(assignment_id,client_name,preparer_email,document_name) values ('aB','x','prepA@test.com','W2')" blocked
t "can't file a ticket as Preparer B"       authenticated "$A" "insert into support_tickets(subject,preparer_email) values ('x','prepB@test.com')" blocked
t "CAN add doc request to own client"       authenticated "$A" "insert into document_requests(assignment_id,client_name,preparer_email,document_name) values ('aA','Client of A','prepA@test.com','W2')" ok
t "can't read uploaded docs directly"       authenticated "$A" "select count(*) from storage.objects" 0

echo "== Admin =="
t "sees ALL returns"                        authenticated "$ADMIN" "select count(*) from client_assignments" 2
t "sees ALL intake submissions"             authenticated "$ADMIN" "select count(*) from form_submissions" 3
t "marks A's return Funded"                 authenticated "$ADMIN" "$(upd "update client_assignments set status='Funded' where id='aA'")" 1
t "earning auto-calculated (800 @ 70/30)"   postgres '{}' "select return_fee||'|'||tier||'|'||preparer_share||'|'||firm_share from earnings where assignment_id='aA'" "800|70/30|560.00|240.00"
t "A sees own earning, read-only"           authenticated "$A" "select count(*) from earnings" 1
t "A can't edit own earning"                authenticated "$A" "$(upd "update earnings set preparer_share=800")" 0
t "locks A's phone field"                   authenticated "$ADMIN" "$(upd "update preparers set locked_fields='[\"phone\"]' where id='pA'")" 1
t "A now can't change locked phone"         authenticated "$A" "update preparers set phone='999' where id='pA'" blocked
t "reads uploaded docs"                     authenticated "$ADMIN" "select count(*) from storage.objects" 1

echo "== Deactivation switch =="
t "admin deactivates Preparer A"            authenticated "$ADMIN" "$(upd "update preparers set active=false where id='pA'")" 1
t "A instantly sees 0 returns"              authenticated "$A" "select count(*) from client_assignments" 0
t "A instantly sees 0 intakes"              authenticated "$A" "select count(*) from form_submissions" 0
t "A instantly sees 0 earnings"             authenticated "$A" "select count(*) from earnings" 0
t "A can't create doc requests"             authenticated "$A" "insert into document_requests(assignment_id,client_name,preparer_email,document_name) values ('aA','x','prepA@test.com','W2')" blocked

echo
echo "RESULT: $pass passed, $fail failed"
[[ $fail -eq 0 ]]
