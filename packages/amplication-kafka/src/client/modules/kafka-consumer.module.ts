import {DynamicModule, Module, Type} from "@nestjs/common";
import { ConfigModule, ConfigService } from '@nestjs/config';

import {KafkaClientModule} from "./kafka-client.module";
import {KafkaConsumerConfigDto} from "../dtos";
import {KafkaConsumer} from "../kafka.consumer";
import {CONSUMER_KAFKA_KEY_SERIALIZER, CONSUMER_KAFKA_VALUE_SERIALIZER} from "../types";
import {KafkaClient} from "../kafka-client";

@Module({})
export class KafkaConsumerModule {
    public static register<K, V>(keySerializerClass: Type<K>,
                                      valueSerializerClass: Type<V>): DynamicModule {
        return {
            module: KafkaConsumerModule,
            imports: [KafkaClientModule,ConfigModule],
            providers: [{
                provide: KafkaConsumerConfigDto,
                inject: [ConfigService],
                useFactory: (configService: ConfigService) => {
                    const groupId = configService.get(KafkaConsumerConfigDto.ENV_KAFKA_GROUP_ID);
                    const concurencyFactor = configService.get(KafkaConsumerConfigDto.ENV_KAFKA_CONSUMER_CONCURENCY_FACTOR);
                    const autoCommit = configService.get(KafkaConsumerConfigDto.ENV_KAFKA_AUTO_COMMIT);
                    return new KafkaConsumerConfigDto(groupId, concurencyFactor,autoCommit)
                }
            }, {
                provide: CONSUMER_KAFKA_KEY_SERIALIZER,
                useClass: keySerializerClass
            }, {
                provide: CONSUMER_KAFKA_VALUE_SERIALIZER,
                useClass: valueSerializerClass
            },KafkaClient,KafkaConsumer],
            exports: [KafkaConsumerConfigDto,KafkaConsumer]
        }
    }

}
