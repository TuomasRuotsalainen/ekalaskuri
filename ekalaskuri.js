module.exports = {




/**
This has been observed to work only when the time difference between different ekas
is at least 10ms. We have to try this functionality in practice to determine 
whether this needs to be fixed or not.
*/
checkEkaisuus : function(nickName, _callback) {
	
	print = function(textLine) {
		console.log(textLine);
	}
	
	var commandList = ['/ekatilanne'];
	var DATA_SEPARATOR = ";";
	var fs = require('fs');
	var userList = [];
	var EKALOG_FILENAME = '/home/no_backup_area/teleirc/src/ekalog.txt';
	var USERS_FILENAME = 'users.txt';
	var areWeTesting = true;
	var ekaResultMessage = '';
	readFileContents = function(filePath, cb){ 

		var str = '';
		
		fs.readFile(filePath, 'utf-8', function(err, data){
		if(err) throw err;
		cb(data);
		});
	}
	
	
	/**
	Requirements for the user data file
	1) File name is users.txt
	2) One line for one user, for example
		1;0;John Doe;johnnyx;ebin1337
		
		Each data value is separated with a ';'
		First data value is the unique index for the user
		Second data value is the current eka-score for the user	
		The rest data values are the nickenames the user is known in Telegram or IRC channels
	
	*/
	createUserFromLine = function(textLine) {
		
		textLine = textLine.replace(/(\r\n|\n|\r)/gm,"");
		var userData = textLine.toString().split(DATA_SEPARATOR);
		if (userData.length < 3 ) {
			 //TODO error in the data, create notification
		}
		
		var userId = userData[0];
		var userScore = userData[1];
		var userNicknames = [];

		for (var i = 2; i<userData.length; i++) {
				userNicknames.push(userData[i]);
		}
		var user = {id:userId, score:userScore, nicknames:userNicknames};
	
		userList.push(user);
		
	}
	
	isThisNewEka = function(oldEkaMillis, currentMillis) {
		var options = {
					timeZone: 'Europe/Helsinki',
					year: 'numeric', month: 'numeric', day: 'numeric',
					hour: 'numeric', minute: 'numeric', second: 'numeric', millisecond: 'numeric'
					},
					formatter = new Intl.DateTimeFormat([], options);
					
					
		var oldEka = new Date(oldEkaMillis);
		var candidate = new Date(currentMillis);
		var lastMidnight = new Date();
		lastMidnight.setHours(0,0,0,0);
		
		try {
			formatter.format(oldEka);
		} catch (e) {
			// There is a problem with the eka file! Let's give current user an eka and notify
			// TODO notify
			return true;
		}
		
		

		

		var lasMidnightMillis = lastMidnight.getTime();
		
		
		if (currentMillis < oldEkaMillis) {
			// TODO: resolve what to do now! This should not be possible
		} else if (lasMidnightMillis < oldEka) {
			// Eka has already happened this day (after last midnight)
			return false;
		} else {
			// If eka has not happened this day, log eka!
			return true;
		}
	}
	
	updateEkaFile = function(milliseconds) {
		fs.writeFile(EKALOG_FILENAME, milliseconds, function(err) {
		if(err) {
			return console.log(err);
		}

		
		}); 
	}
	
	
	parseNewFileContents = function() {
		var contents = [];
		var giveThisManAnEka;
	    var foundEkaaingUser = false;
		var ekaSituation = 'Tämänhetkinen ekatilanne: ';
		
		for (var i = 0; i < userList.length; i++) {
				
			giveThisManAnEka = false;
			var user = userList[i];
			
			var scoreAddition = 0;
			if (user.nicknames.indexOf(nickName, 0) != -1) {
				// Found the ekaaing user.
				giveThisManAnEka = true;
				scoreAddition = 1;
				foundEkaaingUser = true;
				
			}
			
			var score = parseInt(user.score)+scoreAddition;
			var textFileLine = (user.id + ';' + score.toString() + ';' + user.nicknames.join(';')).toString();
			ekaSituation = ekaSituation + user.nicknames[0] + ': ' + score + ', ';

			contents.push(textFileLine);
		}
		
		if (!foundEkaaingUser) {
			//TODO ekaaing user didn't match! A notification is needed!
			ekaResultMessage = ekaResultMessage + 'Valitettavasti kyseistä käyttäjää ei löydy virallisesta ekatietokannasta ja pisteitä ei kirjata. '
			+ 'Ole hyvä ja ota yhteyttä järjestelmän toimittajaan saadaksesi itsesi listalle.';
		} else {
			ekaResultMessage = ekaResultMessage + ekaSituation;
		}
		return contents.join("\r\n");
		
	}
	
	updateScoreFile = function() {

		var fileContents = parseNewFileContents();
		fs.writeFile(USERS_FILENAME, fileContents, function(err) {
		if(err) {
			return console.log(err);
		}

		
		});
	}
	
	startExecution = function() {
		readFileContents(EKALOG_FILENAME, function(timedata) {
				var now = new Date();
				var nowMillis = now.getTime();
				var ekaMillis = parseInt(timedata+'');
				var ekaTime = new Date(ekaMillis);
				
				if (isThisNewEka(ekaMillis, nowMillis) || areWeTesting) {
					ekaResultMessage = 'Onneksi olkoon ekasta ' + nickName + '! ';
					// now we need to log new eka to ekalog and update user score
					// Note that we don't wait for this to finnish
					
					updateEkaFile(nowMillis);
					
					readFileContents(USERS_FILENAME, function(data) { 

					var lines = data.split('\r\n');
			
					for(var line = 0; line < lines.length; line++){
						createUserFromLine(lines[line]);
					}
					updateScoreFile();
					_callback(ekaResultMessage);
					});	
				} else {
					// No eka
					ekaResultMessage = 'no_eka'
					_callback(ekaResultMessage);
				}				
			});
	}
	
	startExecution();
}
}