import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { HttpExceptionFilter } from 'src/common/filters/http-exception.filter';
import { LoggingInterceptor } from 'src/common/interceptors/logging.interceptor';
import configuration from 'src/config/configuration';
import { AuthModule } from 'src/modules/auth/auth.module';
import { EventsModule } from 'src/modules/events/events.module';
import { JobsModule } from 'src/modules/jobs/jobs.module';
// import { FirebaseModule } from 'src/modules/firebase/firebase.module';
@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
    }),
    AuthModule,
    ScheduleModule.forRoot(),
    JobsModule,
    EventsModule,
    // FirebaseModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule {}
