function convertTimeHour(dateString) {
  let archiveHour = parseInt(dateString[11] + dateString[12]);

  let archiveHourGmt = archiveHour - 7; //23 //

  if (archiveHourGmt < 0) {
    archiveHourGmt += 24;
  } else if (archiveHourGmt >= 24) {
    archiveHourGmt -= 24;
  }

  if (archiveHourGmt < 10) {
    return `0${archiveHourGmt}`;
  } else {
    return `${archiveHourGmt}`;
  }
}

module.exports = {
  convertTimeHour,
};
