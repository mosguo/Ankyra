import { Controller, Get, Query } from "@nestjs/common";
import { ListMemoriesQuery } from "@packages/application/src/contracts/queries/list-memories.query";
import { MemoryService } from "@packages/application/src/conversations/memory.service";

@Controller("memories")
export class MemoryController {
  constructor(private readonly memoryService: MemoryService) {}

  @Get()
  list(@Query() query: ListMemoriesQuery) {
    return this.memoryService.listMemories(query);
  }
}
