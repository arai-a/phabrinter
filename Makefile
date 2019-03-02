all:
	rm -f phabrinter.xpi
	zip -9 phabrinter.xpi phabrinter.js phabrinter.css options.html options.js globalState.js manifest.json phabrinter.png

i: all
	open -a FirefoxNightly phabrinter.xpi

ia: all
	open -a FirefoxAurora phabrinter.xpi
