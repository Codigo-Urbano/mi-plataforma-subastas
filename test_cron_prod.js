
fetch("https://subastas-pro.com/api/cron/finalizar-subastas")
  .then(res => res.text())
  .then(text => console.log(text.substring(0, 500)))
  .catch(console.error);

