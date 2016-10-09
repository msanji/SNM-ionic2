import {Component, ViewChild} from '@angular/core';

import {
  AlertController,
  App,
  ItemSliding,
  List,
  ModalController,
  NavController,
  ActionSheet,
  ActionSheetController
} from 'ionic-angular';

import {ConferenceData} from '../../providers/conference-data';
import {DoctorService} from '../../providers/doctors-data';
import {ScheduleFilterPage} from '../schedule-filter/schedule-filter';
import {SessionDetailPage} from '../session-detail/session-detail';
import {UserData} from '../../providers/user-data';


@Component({
  selector: 'page-schedule',
  templateUrl: 'channel.html'
})
export class SchedulePage {
  // the list is a child of the schedule page
  // @ViewChild('scheduleList') gets a reference to the list
  // with the variable #scheduleList, `read: List` tells it to return
  // the List and not a reference to the element
  @ViewChild('scheduleList', {read: List}) scheduleList: List;

  dayIndex = 0;
  queryText = '';
  segment = 'all';
  excludeTracks = [];
  shownSessions: any = [];
  groups = [];
  doctors = [];
  actionSheet: ActionSheet;

  constructor(public alertCtrl: AlertController,
              public app: App,
              public modalCtrl: ModalController,
              public navCtrl: NavController,
              public confData: ConferenceData,
              public doctorService: DoctorService,
              public user: UserData, public actionSheetCtrl: ActionSheetController) {

  }

  ionViewDidEnter() {
    this.app.setTitle('Channel');
  }

  ngAfterViewInit() {
    this.updateSchedule();
  }

  updateSchedule() {
    // Close any open sliding items when the schedule updates
    this.scheduleList && this.scheduleList.closeSlidingItems();

    this.confData.getTimeline(this.dayIndex, this.queryText, this.excludeTracks, this.segment).then(data => {
      this.shownSessions = data.shownSessions;
      this.groups = data.groups;
    });
    /*this.doctorService.load().then(data => {
     console.log(data);
     return this.doctors=data;

     });*/
    this.doctorService.search(this.queryText).then(data=> {
      console.log(data);
      return this.doctors = data;
    });
  };

  search() {
    this.doctors = this.doctorService.search(this.queryText);
    /*if (this.queryText&& this.queryText !== '') {
     this.doctors = this.doctors.filter((item) => {
     return (item.name.toLowerCase().indexOf(this.queryText.toLowerCase()) > -1);
     })
     }else{
     this.doctors=this.doctorService.load();
     }*/
  }

  presentFilter() {
    let modal = this.modalCtrl.create(ScheduleFilterPage, this.excludeTracks);
    modal.present();

    modal.onDidDismiss((data: any[]) => {
      if (data) {
        this.excludeTracks = data;
        this.updateSchedule();
      }
    });

  }

  goToSessionDetail(sessionData) {
    // go to the session detail page
    // and pass in the session data
    this.navCtrl.push(SessionDetailPage, sessionData);
  }

  addFavorite(slidingItem: ItemSliding, sessionData) {

    if (this.user.hasFavorite(sessionData.name)) {
      // woops, they already favorited it! What shall we do!?
      // prompt them to remove it
      this.removeFavorite(slidingItem, sessionData, 'Favorite already added');
    } else {
      // remember this session as a user favorite
      this.user.addFavorite(sessionData.name);

      // create an alert instance
      let alert = this.alertCtrl.create({
        title: 'Favorite Added',
        buttons: [{
          text: 'OK',
          handler: () => {
            // close the sliding item
            slidingItem.close();
          }
        }]
      });
      // now present the alert on top of all other content
      alert.present();
    }

  }

  removeFavorite(slidingItem: ItemSliding, sessionData, title) {
    let alert = this.alertCtrl.create({
      title: title,
      message: 'Would you like to remove this session from your favorites?',
      buttons: [
        {
          text: 'Cancel',
          handler: () => {
            // they clicked the cancel button, do not remove the session
            // close the sliding item and hide the option buttons
            slidingItem.close();
          }
        },
        {
          text: 'Remove',
          handler: () => {
            // they want to remove this session from their favorites
            this.user.removeFavorite(sessionData.name);
            this.updateSchedule();

            // close the sliding item and hide the option buttons
            slidingItem.close();
          }
        }
      ]
    });
    // now present the alert on top of all other content
    alert.present();
  }

  openContact(doctor) {
    //let mode = this.config.get('mode');

    let actionSheet = this.actionSheetCtrl.create({
      title: 'Contact with ' + doctor.name,
      buttons: [
        {
          text: `Request Appointment`,

          handler: () => {
            window.open('mailto:' + doctor.email);
          }
        }
      ]
    });

    actionSheet.present();
  }
}
