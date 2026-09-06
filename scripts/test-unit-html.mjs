async function test() {
  const res = await fetch("http://localhost:3000/bpharm/1st-semester/human-anatomy-physiology-and-pathophysiology-i/unit-1");
  console.log("Status:", res.status);
  const text = await res.text();
  const fileUrlIdx = text.indexOf("fileUrl");
  console.log("fileUrl snippet:", text.substring(fileUrlIdx - 10, fileUrlIdx + 200));
}
test();
