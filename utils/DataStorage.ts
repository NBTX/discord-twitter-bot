import * as fs from "fs";
import * as path from "path";

type DataModifyFunction = (data: StoredData) => Promise<StoredData>;

export default class DataStorage {
    
    private readonly fileName: string;
    private data: StoredData;

    constructor (fileName: string) {
        this.fileName = fileName;
    }
    
    async load () {
        try {
            await fs.promises.stat(this.fileName)
        }catch(ex){
            await fs.promises.mkdir(path.dirname(this.fileName));
            await fs.promises.writeFile(this.fileName, `{ "channels": [] }`);
        }
        
        this.data = JSON.parse(await fs.promises.readFile(this.fileName, 'utf8'));
    }
    
    get () : StoredData {
        return this.data;
    }
    
    async modify (modifyFunction: DataModifyFunction) {
        this.data = await modifyFunction(this.data);
        await fs.promises.writeFile(this.fileName, JSON.stringify(this.data), {
            encoding: 'utf8'
        });
    }

}

interface TwitterBotChannel {
    
    /**
     * Whether or not the bot should be active in this channel.
     */
    active: boolean;
    
    /**
     * The ID of the guild that the channel belongs to.
     */
    guild: string;
    
    /**
     * The channel that tweets should be automatically converted in.
     */
    channel: string;
    
}

interface StoredData {
    
    channels: TwitterBotChannel[]
    
}