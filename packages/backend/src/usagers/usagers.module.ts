import { forwardRef, Module } from "@nestjs/common";
import { DatabaseModule } from "../database/database.module";
import { InteractionsModule } from "../interactions/interactions.module";
import { StructuresModule } from "../structures/structure.module";
import { UsersModule } from "../users/users.module";
import { ImportController } from "./controllers/import.controller";
import { UsagersController } from "./controllers/usagers.controller";
import { CerfaService } from "./services/cerfa.service";
import { DocumentsService } from "./services/documents.service";
import { UsagersService } from "./services/usagers.service";
import { UsagersProviders } from "./usagers.providers";

@Module({
  controllers: [UsagersController, ImportController],
  exports: [
    UsagersService,
    CerfaService,
    DocumentsService,
    ...UsagersProviders
  ],
  imports: [
    DatabaseModule,
    forwardRef(() => UsersModule),
    StructuresModule,
    forwardRef(() => InteractionsModule)
  ],
  providers: [
    UsagersService,
    CerfaService,
    DocumentsService,
    ...UsagersProviders
  ]
})
export class UsagersModule {}
