"use server";

import { CosmosDBContainer } from "@/features/common/cosmos-prompt";
import { SqlQuerySpec } from "@azure/cosmos";

import {
    PromptList
  } from "../../chat-services/models";
  
interface Item {
  title: string,
  content: string,
  id: string,
  dept: string,
  usename: string,
  createdAt: Date;
  isDeleted: boolean;
  sortOrder: number;
}

export const AddPrompt = async (newPrompt: Item) => {
  const container = await CosmosDBContainer.getInstance().getContainer();
  await container.items.create(newPrompt);
};

export async function queryPrompt(dept: string, usename: string) {
  const container = await CosmosDBContainer.getInstance().getContainer();

  const querySpec: SqlQuerySpec = {
    query:
      "SELECT * FROM c WHERE c.dept = @dept AND c.usename = @usename AND c.isDeleted = @isDeleted ORDER BY c.sortOrder ASC",
    parameters: [
      {
        name: "@dept",
        value: dept,
      },
      {
        name: "@usename",
        value: usename,
      },
      {
        name: "@isDeleted",
        value: false,
      },
    ],
  };

  const { resources } = await container.items
    .query<PromptList>(querySpec)
    .fetchAll();

  return resources;
}

export async function markAsDeleted(id: string) {
  const container = await CosmosDBContainer.getInstance().getContainer();

  // 該当するレコードを取得
  const { resource: item } = await container.item(id).read<Item>();

  if (item) {
    // isDeleted を true に更新
    item.isDeleted = true;

    // レコードを更新
    const { resource: updatedItem } = await container
      .item(id)
      .replace(item);

    return updatedItem;
  } else {
    throw new Error(`Item with id ${id} not found`);
  }
}
// title と content を更新する処理
export async function updateItem(id: string, newTitle: string, newContent: string) {
  const container = await CosmosDBContainer.getInstance().getContainer();

  // 該当するレコードを取得
  const { resource: item } = await container.item(id).read<Item>();

  if (item) {
    // title と content を更新
    item.title = newTitle;
    item.content = newContent;

    // レコードを更新
    const { resource: updatedItem } = await container
      .item(id)
      .replace(item);

    return updatedItem;
  } else {
    throw new Error(`Item with id ${id} not found`);
  }
}

// 会社全体用プロンプト取得
export async function queryPromptCompany(dept: string) {
  const container = await CosmosDBContainer.getInstance().getContainer();

  const querySpec: SqlQuerySpec = {
    query:
      "SELECT * FROM c WHERE c.dept = @dept AND c.isDeleted = @isDeleted ORDER BY c.sortOrder ASC",
    parameters: [
      {
        name: "@dept",
        value: dept,
      },
      {
        name: "@isDeleted",
        value: false,
      },
    ],
  };

  const { resources } = await container.items
    .query<PromptList>(querySpec)
    .fetchAll();

  return resources;
}

// 複数プロンプトのsortOrderを一括更新
export async function updateSortOrders(updates: {id: string, sortOrder: number}[]) {
  const container = await CosmosDBContainer.getInstance().getContainer();
  for (const {id, sortOrder} of updates) {
    const { resource: item } = await container.item(id).read<Item>();
    if (item) {
      item.sortOrder = sortOrder;
      await container.item(id).replace(item);
    }
  }
}