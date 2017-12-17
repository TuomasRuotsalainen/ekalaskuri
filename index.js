var logger = require('./log');
var argv = require('./arguments').argv;
var git = require('git-rev-sync');
var pjson = require('../package.json');
var ekalaskuri = require('./ekalaskuri');

require('string.prototype.startswith');

var getVersionStr = function() {
    process.chdir(__dirname);

    var shorthash;
    try {
        shorthash = git.short();
    } catch (e) {
        shorthash = null;
    }

    var version = 'teleirc ';
    if (shorthash) {
        version += 'git-' + shorthash + ' (on branch: ' + git.branch() + '), ';
    }

    version += 'npm-' + pjson.version;

    return version;
};

if (argv.version) {
    console.log(getVersionStr());
} else {
    var config = require('./config');

    logger.level = config.logLevel;

    var msgCallback = function(message) {
        // if  isThisEka(
        //      update result text file
        //      tg.send() postaa telegramiin, irc.send() postaa irkkiin
        //
		getNickNameFromTgText = function(message) {
			var list = message.text.split('>');
			return list[0].substr(1);
		}
		//because messages are of type <John Doe> texttext
		var nickName;
		if (message.protocol == 'tg') {
			nickName = getNickNameFromTgText(message);
		} else {
			nickName = message.user;
		}
		
		
		ekalaskuri.checkEkaisuus(nickName, function(response) {
			var ekaMessage = Object.assign({}, message);
			
			
			//ekaMessage.user = 'Ekabotti';
			
			if(response == 'no_eka') {
				// No eka, proceed normally
				ekaMessage.text = 'Ei ollut eka';
				//irc.send(ekaMessage);
			} else {
				// There is an Eka, notify channel!
				ekaMessage.text = response;
				irc.send(ekaMessage);
				tg.send(ekaMessage);
			}
		});
    
	
	switch (message.protocol) {
				case 'irc':
					// dont modify

				   //7 if (message.user == 'Jinchu') {
				   //     message.user = 'Irc-kommentti: ';
					//    message.text = 'irc osio toimii kuten strömsössä!';
				   // };
				   
					tg.send(message);
					break;
				case 'tg':
				   // message.user = 'TG-kommentti:';
				   // message.text = 'Myös tg-osio toimii, täydellinen onnistuminen!';

					var channel = message.channel;

					if (message.cmd === 'getNames') {
						return irc.getNames(channel);
					} else if (message.cmd === 'getTopic') {
						return irc.getTopic(channel);
					} else if (message.cmd === 'getVersion') {
						message.text = 'Version: ' +
							getVersionStr();

						return tg.send(message);
					} else if (message.cmd === 'sendCommand') {
						if (!config.allowCommands) {
							message.text = 'Commands are disabled.';
							return tg.send(message);
						}

						if (!message.text) {
							message.text = 'Usage example: /command !foobar';
							return tg.send(message);
						} else {
							var command = message.text;

							// prepend with line containing original message
							message.text = message.origText + '\n' + message.text;
							irc.send(message, true);

							message.text = 'Command "' + command + '" executed.';
							return tg.send(message);
						}
					} else {
						irc.send(message);
					}
					break;
				default:
					logger.warn('unknown protocol: ' + message.protocol);
	}
	};
    var irc = require('./irc')(msgCallback);
    var tg = require('./tg')(msgCallback);
}
