import { describe, test } from "vitest";
import { usingMessageHandlers } from "./messageHandlers";
import { MessageHandlers } from "./types/messageHandlers";
import { Message } from "./types/message";

type FooMessage = Message<'FOO', null>

describe("usingMessageHandlers", () => {
    const fn = usingMessageHandlers({
        FOO: ({msg}) => { return null}
    // }) 
    } as MessageHandlers<FooMessage>) 
})