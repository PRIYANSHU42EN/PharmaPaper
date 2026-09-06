async function inspectSubjectMore() {
  const subRes = await fetch("http://localhost:3000/bpharm/1st-semester/basics-of-python-programming-for-pharmaceutical-sciences");
  const subHtml = await subRes.text();
  const subjectNameIdx = subHtml.indexOf("Basics of Python");
  console.log("Found subject name at:", subjectNameIdx);
  if (subjectNameIdx >= 0) {
    console.log(subHtml.substring(subjectNameIdx, subjectNameIdx + 2000));
  } else {
    console.log("Subject name NOT found in HTML. Check 404 or redirect?");
    console.log("Status:", subRes.status);
    console.log("Snippet:", subHtml.substring(0, 500));
  }
}
inspectSubjectMore();
