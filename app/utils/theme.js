class Theme {

    getTheme() {
        // return require('../../assets/config/light.json');
        return require('../../assets/config/night.json');
    }
}

module.exports = new Theme();
