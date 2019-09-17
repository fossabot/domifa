import { Test, TestingModule } from "@nestjs/testing";
import * as mongoose from "mongoose";
import { DatabaseModule } from "../../database/database.module";
import { UsersModule } from "../../users/users.module";
import { UsersService } from "../../users/users.service";
import { SearchDto } from "../dto/search";
import { UsagersDto } from "../dto/usagers.dto";
import { UsagerSchema } from "../usager.schema";
import { UsagersProviders } from "../usagers.providers";

import { forwardRef } from "@nestjs/common";
import { CerfaService } from "./cerfa.service";
import { UsagersService } from "./usagers.service";

describe("UsagersService", () => {
  let service: UsagersService;
  let userService: UsersService;

  const fakeUsagerDto = new UsagersDto();
  const fakePatchUsagerDto = new UsagersDto();
  const searchDto = new SearchDto();

  fakeUsagerDto.nom = "Usager";
  fakeUsagerDto.prenom = "De test";
  fakeUsagerDto.surnom = "Chips";
  fakeUsagerDto.sexe = "homme";
  fakeUsagerDto.dateNaissance = new Date();
  fakeUsagerDto.villeNaissance = "Paris";
  fakeUsagerDto.email = "chips@gmail.com";

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [DatabaseModule, forwardRef(() => UsersModule)],
      providers: [UsagersService, CerfaService, ...UsagersProviders]
    }).compile();

    service = module.get<UsagersService>(UsagersService);
    userService = module.get<UsersService>(UsersService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  it("0. Create / Read / Update / Delete", async () => {
    // LAST ID
    expect(service.findAll()).toBeTruthy();
    expect(await service.findLast()).toEqual(5);

    // CREATE
    const user = await userService.findOne({ id: 1 });

    fakeUsagerDto.structureId = user.structureId;
    const usagerTest = await service.create(fakeUsagerDto);

    expect(usagerTest).toBeDefined();
    expect(usagerTest.id).toEqual(5);

    // READ
    const usager = await service.findById(5, user.structureId);
    expect(usager).toBeTruthy();
    expect(usager.nom).toEqual("Usager");
    expect(usager.sexe).toEqual("homme");

    // UPDATE
    fakePatchUsagerDto.nom = "Nouveau nom";
    fakePatchUsagerDto.prenom = "Nouveau prénom";
    fakePatchUsagerDto.id = usager.id;

    const updatedUser = await service.patch(fakePatchUsagerDto, user);

    expect(updatedUser.nom).toEqual("Nouveau nom");
    expect(updatedUser.prenom).toEqual("Nouveau prénom");

    // DELETE
    const deletedUsager = await service.deleteById(5);
    expect(await deletedUsager.deletedCount).toEqual(1);
  });

  it("2. Doublons", async () => {
    const doublons = await service.isDoublon("del", "Kar");
    expect(doublons.length).toEqual(1);
  });

  it("2. Search", async () => {
    expect(service.findAll()).toBeTruthy();

    searchDto.sort = "az";
    searchDto.statut = "valide";
    const user = await userService.findOne({ id: 2 });

    service.search(searchDto, user.structureId);

    expect(service.searchQuery).toEqual({
      "decision.statut": "valide",
      structureId: 2
    });

    expect(service.sort).toEqual({ nom: "ascending" });

    searchDto.sort = "za";
    searchDto.interactionType = "courrierIn";

    service.search(searchDto, 2);
    expect(service.sort).toEqual({ nom: "descending" });
    expect(service.searchQuery).toEqual({
      "decision.statut": "valide",
      "lastInteraction.nbCourrier": { $gt: 0 },
      structureId: 2
    });

    delete searchDto.interactionType;
    searchDto.name = "as";

    service.search(searchDto, 2);
    expect(service.searchQuery).toEqual({
      $or: [
        { nom: { $regex: ".*as.*", $options: "-i" } },
        { prenom: { $regex: ".*as.*", $options: "-i" } },
        { surnom: { $regex: ".*as.*", $options: "-i" } }
      ],
      "decision.statut": "valide",
      structureId: 2
    });
  });
});
