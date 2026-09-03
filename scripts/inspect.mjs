async function inspect() {
  // 1. Subject page
  const subRes = await fetch("http://localhost:3000/bpharm/1st-semester/basics-of-python-programming-for-pharmaceutical-sciences");
  console.log("Subject status:", subRes.status, subRes.url);
  const subHtml = await subRes.text();
  console.log("Subject HTML snippet:", subHtml.substring(0, 1000));

  // 2. Admin page
  const adminRes = await fetch("http://localhost:3000/admin");
  console.log("Admin status:", adminRes.status, adminRes.url);
  const adminHtml = await adminRes.text();
  console.log("Admin HTML snippet:", adminHtml.substring(0, 1000));

  // 3. Terms page
  const termsRes = await fetch("http://localhost:3000/terms");
  console.log("Terms status:", termsRes.status, termsRes.url);
  const termsHtml = await termsRes.text();
  console.log("Terms contains 'Terms &amp; Conditions'?:", termsHtml.includes("Terms &amp; Conditions"));
}
inspect();
