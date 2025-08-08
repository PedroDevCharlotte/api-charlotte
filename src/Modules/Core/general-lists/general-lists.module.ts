import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Entities
import { EntityDefinition } from './Entity/entity.entity';
import { GeneralList } from './Entity/general-list.entity';
import { ListOption } from './Entity/list-option.entity';
import { ListOptionTranslation } from './Entity/list-option-translation.entity';
import { FieldDefinition } from './Entity/field-definition.entity';
import { EntityFieldValue } from './Entity/entity-field-value.entity';

// Services
import { GeneralListsService } from './general-lists.service';
import { ListOptionsService } from './list-options.service';

// Controllers
import { GeneralListsController } from './general-lists.controller';
import { ListOptionsController } from './list-options.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      EntityDefinition,
      GeneralList,
      ListOption,
      ListOptionTranslation,
      FieldDefinition,
      EntityFieldValue,
    ]),
  ],
  controllers: [
    GeneralListsController,
    ListOptionsController,
  ],
  providers: [
    GeneralListsService,
    ListOptionsService,
  ],
  exports: [
    GeneralListsService,
    ListOptionsService,
    TypeOrmModule,
  ],
})
export class GeneralListsModule {}
