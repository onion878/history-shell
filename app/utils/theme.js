class Theme {

    getTheme(theme) {
        // return require('../../assets/config/light.json');
        if(theme) {
            return require(`../../assets/config/${theme}.json`);
        }
        return require('../../assets/config/night.json');
    }
}

module.exports = new Theme();
