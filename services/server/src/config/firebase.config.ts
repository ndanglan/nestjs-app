import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseService {
  private firebaseApp: admin.app.App;

  constructor(private configService: ConfigService) {
    this.initializeApp();
  }

  private initializeApp() {
    // Khởi tạo Firebase Admin
    this.firebaseApp = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: this.configService.get('firebase.projectId'),
        clientEmail: this.configService.get('firebase.clientEmail'),
        privateKey: this.configService
          .get('firebase.privateKey')
          .replace(/\\n/g, '\n'),
      }),
    });
  }

  getAuth() {
    return this.firebaseApp.auth();
  }

  getFirestore() {
    return this.firebaseApp.firestore();
  }
}
