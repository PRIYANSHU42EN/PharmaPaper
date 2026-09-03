async function inspectUnitPage() {
  const unitRes = await fetch("http://localhost:3000/bpharm/1st-semester/basics-of-python-programming-for-pharmaceutical-sciences/unit-1");
  const unitHtml = await unitRes.text();
  console.log("Unit page status:", unitRes.status);
  const mainIdx = unitHtml.indexOf("<main");
  console.log("Unit page main section:", unitHtml.substring(mainIdx, mainIdx + 2000));
}
inspectUnitPage();
