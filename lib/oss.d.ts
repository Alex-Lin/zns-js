

declare class Oss {
    constructor(config: Oss.OssConfig);
    getBucketName(): string;
    setBucketName(name: string): void;
    getObject(param: Oss.GetObjParam, callback: Function);
    putObject(param: Oss.PutObjParam, callback: Function);
}

declare namespace Oss {
    export interface PutObjParam {
        Bucket?: string,
        public?: Boolean,
        Key: string,
        Body: string | Buffer
    }

    export interface GetObjParam {
        Bucket: string,
        Key: string
    }

    export interface AwsHttpOptions {
        agent: any;
    }

    export interface AwsConfig {
        httpOptions: AwsHttpOptions;
        accessKeyId: string;
        secretAccessKey: string;
        region: string;
    }

    export interface QQConfig {
        AppId: string;
        SecretId: string;
        SecretKey: string;
        Domain?: string;
        region: string;
    }


    export interface OssConfig {
        type: string;
        bucketName: string;
        folderName?: string;
        aws?: AwsConfig;
        qq?: QQConfig;
    }

    export import Types = Oss;
}

export = Oss;
