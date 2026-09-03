async function inspectBody() {
  const subRes = await fetch("http://localhost:3000/bpharm/1st-semester/basics-of-python-programming-for-pharmaceutical-sciences");
  const subHtml = await subRes.text();
  const bodyIdx = subHtml.indexOf("<body");
  console.log("=== SUBJECT PAGE BODY ===");
  console.log(subHtml.substring(bodyIdx, bodyIdx + 1500));

  const adminRes = await fetch("http://localhost:3000/admin");
  const adminHtml = await adminRes.text();
  const adminBodyIdx = adminHtml.indexOf("<body");
  console.log("=== ADMIN PAGE BODY ===");
  console.log(adminHtml.substring(adminBodyIdx, adminBodyIdx + 1500));
}
inspectBody();
