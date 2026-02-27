let navData;
fetch("/components/navbar.html")
  .then((res) => res.text())
  
  .then((text) => {
    document.getElementById("navbar").innerHTML = text;
   })
  .catch((e) => console.error(e));


/*let stackIconData;
fetch("/components/stackIcons.html")
  .then((res) => res.text())
  
  .then((text) => {
    document.getElementById("stackIcons").innerHTML = text;
   })
  .catch((e) => console.error(e));*/


let copyrightData;
fetch("/components/copyright.html")
  .then((res) => res.text())
  
  .then((text) => {
    document.getElementById("copyright").innerHTML = text;
   })
  .catch((e) => console.error(e));
