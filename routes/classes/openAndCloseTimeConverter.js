const { convertTZ } = require('../functions/convertDateTimezone');

class OpenAndCloseTimeConverter {
  static hourNow() {
    const date = new Date();
    // const dateJakarta = convertTZ(date, 'Asia/Jakarta');

    let hourNow = date.getHours();
    // console.log(hourNow);

    if (hourNow >= 0 && hourNow <= 12) {
      hourNow = hourNow + 24;
    }

    return hourNow;
  }

  static open() {
    const hourNow = this.hourNow();
    const rangeToFrom = hourNow - 13;
    // UNCERTAINTY OF 1 HOUR
    const dateFromString = Date.now() - rangeToFrom * 60 * 60 * 1000;
    return new Date(dateFromString);
  }

  static close() {
    const hourNow = this.hourNow();
    const rangeToTo = 28 - hourNow;
    const dateToString = Date.now() + rangeToTo * 60 * 60 * 1000;
    return new Date(dateToString);
  }
}

module.exports = {
  OpenAndCloseTimeConverter,
};
