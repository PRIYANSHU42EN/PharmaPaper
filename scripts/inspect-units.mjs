async function inspectSubjectUnits() {
  const subRes = await fetch("http://localhost:3000/bpharm/1st-semester/basics-of-python-programming-for-pharmaceutical-sciences");
  const subHtml = await subRes.text();
  const selectUnitIdx = subHtml.indexOf("Select Your Unit");
  console.log("Select Your Unit idx:", selectUnitIdx);
  if (selectUnitIdx >= 0) {
    console.log(subHtml.substring(selectUnitIdx, selectUnitIdx + 2000));
  } else {
    console.log("Select Your Unit NOT found!");
    // Print what is in main tag
    const mainIdx = subHtml.indexOf("<main");
    console.log(subHtml.substring(mainIdx, mainIdx + 2000));
  }
}
inspectSubjectUnits();
