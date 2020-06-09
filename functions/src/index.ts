import { Firestore } from '@google-cloud/firestore';
import * as firebase from 'firebase-admin';
import * as functions from 'firebase-functions';

import * as sg from '@sendgrid/mail';
import * as express from 'express';
import * as cors from 'cors';
import * as qr from 'qrcode';
import * as moment from 'moment-timezone';

const db = new Firestore({
	projectId: 'FIREBASEPROJECTID',
	timestampsInSnapshots: true,
});
const SENDGRID_KEY = functions.config().sendgrid.key;
sg.setApiKey(SENDGRID_KEY);


const app = express();
app.use(cors({ origin: true }));
app.post('/forms/submit/:id', async (req, res) => {
	const data = req.body;
	data.Submission = new Date();
	data.ServiceTime.time = moment(data.ServiceTime.time * 1000).toDate();
	const docRef = await db.collection(`forms/${req.params.id}/responses`).add(data);
	const qrcode = await qr.toDataURL(docRef.id, { errorCorrectionLevel: 'H' });
	const date = moment(data.ServiceTime.time);
	const msg = {
		to: data.Email,
		from: {
			name: 'Grace Church',
			email: 'no-reply@grace.church',
		},
		templateId: 'd-185952f4d65144f1b406a017c1c51d55',
		dynamic_template_data: {
			first_name: data.Name,
			date: date.tz('America/Chicago').format('dddd, MMMM Do YYYY'),
			time: date.tz('America/Chicago').format('LT'),
			seat: (data.Count == 1)? "" : "s",
			campus: data.Campus,
			count: data.Count,
		},
		attachments: [
			{
				content: qrcode.substr(qrcode.indexOf(',') + 1),
				filename: 'code.png',
				type: 'image/png',
				content_id: 'code',
				disposition: 'inline',
			},
		]
	};
	await sg.send(msg);

	const newCount: any = {};
	const key: string = date.tz('America/Chicago').format()+'_'+data.ServiceTime.name;
	newCount[key] = firebase.firestore.FieldValue.increment(-Math.abs(data.Count));
	await db.doc(`forms/vo887dEdCz5hCQzbf5ns`).update(newCount);

	res.send({success:true, data:{...data, id:docRef.id, qrcode:qrcode}});
});

exports.api = functions.https.onRequest(app);


exports.reservationGenerationSchedule = functions.pubsub.schedule('0 8 * * 1').timeZone('America/Chicago').onRun(async context => {
	const nextSunday = moment().tz('America/Chicago').startOf('day').isoWeekday('0');
	const data = await db.doc(`reservation/settings`).get();
	const events: Array<any> = [];
	const push: any = data.data();
	const defautCounts = {ep:data.data().EPCapacity, ch:data.data().CHCapacity};
	const currentCounts = await db.doc(`forms/vo887dEdCz5hCQzbf5ns`).get();
	const newCounts = currentCounts.data();
	data.data().times.forEach(async (element: any) => {
		const time = moment(element.time._seconds * 1000);
		const newDate = moment(nextSunday).add(time.tz('America/Chicago').format('H'), 'hours').add(time.tz('America/Chicago').format('m'), 'minutes');
		element.time = newDate.tz('America/Chicago').toDate();
		events.push(element);

		newCounts[newDate.tz('America/Chicago').format()+'_'+element.name] = (element.name.includes('EP')) ? defautCounts.ep : defautCounts.ch;
	});
	push.times = events;
	console.log(push.times, newCounts);
	await db.doc(`reservation/settings`).set(push);
	await db.doc(`forms/vo887dEdCz5hCQzbf5ns`).set(newCounts);
});
