var ekalaskuri = require('./ekalaskuri');

function sleep (time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}
var message;
var latency = 100;

ekalaskuri.checkEkaisuus('John Doe', function(response) {
	console.log(response);

});

sleep(latency).then(() => {
    //checkEkaisuus('jinchu');
})

sleep(latency*2).then(() => {
    //checkEkaisuus('FIdel');
})

