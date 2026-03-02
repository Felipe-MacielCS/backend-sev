import ical from 'node-ical';

const exportsObj = {};

exportsObj.syncCalendar = async (req, res) => {
  try {
    const { icalUrl } = req.body;
    
    if (!icalUrl) return res.status(400).send({ message: "No calendar link provided." });

    const events = await ical.async.fromURL(icalUrl);
    const formattedEvents = [];

    for (const event of Object.values(events)) {
      if (event.type === 'VEVENT') {
        formattedEvents.push({
          id: event.uid,
          title: 'Unavailable', 
          start: event.start,
          end: event.end,
          color: '#F44336', 
          display: 'block'
        });
      }
    }
    res.send(formattedEvents);
  } catch (error) {
    console.error("Calendar Sync Error:", error);
    res.status(500).send({ message: "Failed to parse calendar." });
  }
};

export default exportsObj;