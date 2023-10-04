const { convertTZ } = require('../functions/convertDateTimezone');

class OpenAndCloseTimeConverter {
  static hourNow() {
    const date = new Date();
    // const dateJakarta = convertTZ(date, 'Asia/Jakarta');
    console.log(date);

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
    const dateFromDate = new Date(dateFromString);
    const dateFromGMTTime = dateFromDate.getTime() - 7 * 60 * 60 * 1000;

    return new Date(dateFromGMTTime);
  }

  static close() {
    const hourNow = this.hourNow();
    const rangeToTo = 28 - hourNow;
    const dateToString = Date.now() + rangeToTo * 60 * 60 * 1000;
    const dateToDate = new Date(dateToString);
    const dateToGMTTime = dateToDate.getTime() - 7 * 60 * 60 * 1000;

    return new Date(dateToGMTTime);
  }
}

module.exports = {
  OpenAndCloseTimeConverter,
};
