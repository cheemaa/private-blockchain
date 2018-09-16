/* ===== Block Class ==============================
|  Class with a constructor for block 			   |
|  ===============================================*/

module.exports = class Star{
	constructor(rawStar){
        this.dec = rawStar.dec;
        this.ra = rawStar.ra;
        this.story = rawStar.story;
        this.magnitude = rawStar.magnitude;
        this.constellation = rawStar.constellation;

        if(this.isDataValid()) {
            this.story = new Buffer(rawStar.story).toString('hex');
        }
        else {
            console.log(this.getErrors());
            throw this.getErrors();
        }
    }

    getDecodedStory() {
        return new Buffer(this.story, 'hex').toString();
    }

    isDataValid() {
        return !(this.dec == undefined || this.dec == '' || this.ra == undefined || this.ra == '' || this.story == undefined || this.story == '' || this.story.split(' ').length > 250);
    }

    getErrors() {
        var errorMessage = "";
        if(this.dec == undefined || this.dec == '') {
            errorMessage = "Field declination missing or empty. "
        }
        if(this.ra == undefined || this.ra == '') {
            errorMessage = errorMessage + "Field right ascension missing or empty. "
        }
        if(this.story == undefined || this.story == '') {
            errorMessage = errorMessage + "Field story missing or empty. "
        }
        else if(this.story.split(' ').length > 250) {
            errorMessage = errorMessage + "Field story can't contain more than 250 words."
        }
        return {message: errorMessage};
    }

    static parsedStar(block) {
        if(block.body && block.body.star && block.body.star.story) {
            block.body.star.storyDecoded = new Buffer(block.body.star.story, 'hex').toString();
        }
        return block;
    };
}