"use strict";
const { Contract } = require("fabric-contract-api");
const crypto = require("crypto");

class UserContract extends Contract {

  async initLedger(ctx) {
    const users = [
      {
        fullname: "phangiathuyen",
        password: "phajkhfdkgjdfhgdusdfsdfsdf4sfsdfsdf",
        role: "admin",
        organization: "admihfff3",
        tokenuser: "sdhfkjsdhgfiusdfy87436sdfsdfsdf",
      }
    ];

    for (let i = 0; i < users.length; i++) {
      await ctx.stub.putState(`USER${i}`, Buffer.from(JSON.stringify(users[i])));
    }
  }

  async createUser(ctx, id, fullname, password, role, organization, tokenuser) {
    const user = {
      fullname,
      password,
      role,
      organization,
      tokenuser,
    };

    await ctx.stub.putState(id, Buffer.from(JSON.stringify(user)));
    return `User ${id} created successfully`;
  }

  async updateUser(ctx, id, fullname, password, role, organization, tokenuser) {
    const userAsBytes = await ctx.stub.getState(id);

    if (!userAsBytes || userAsBytes.length === 0) {
      throw new Error(`User with ID ${id} does not exist`);
    }

    const user = JSON.parse(userAsBytes.toString());

    if (fullname !== undefined) {
      user.fullname = fullname;
    }
    if (password !== undefined) {
      user.password = password;
    }
    if (role !== undefined) {
      user.role = role;
    }
    if (organization !== undefined) {
      user.organization = organization;
    }
    if (tokenuser !== undefined) {
      user.tokenuser = tokenuser;
    }

    await ctx.stub.putState(id, Buffer.from(JSON.stringify(user)));
    return `User ${id} updated successfully`;
  }

  async getUser(ctx, id) {
    const userAsBytes = await ctx.stub.getState(id);

    if (!userAsBytes || userAsBytes.length === 0) {
      throw new Error(`User with ID ${id} does not exist`);
    }

    return userAsBytes.toString();
  }

  async deleteUser(ctx, id) {
    const userAsBytes = await ctx.stub.getState(id);

    if (!userAsBytes || userAsBytes.length === 0) {
      throw new Error(`User with ID ${id} does not exist`);
    }

    await ctx.stub.deleteState(id);
    return `User ${id} deleted successfully`;
  }
  async helloworld(ctx) {
    return "Hello, World!";
  }
}

module.exports = UserContract;
