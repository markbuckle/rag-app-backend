// import * as cdk from 'aws-cdk-lib';
// import { Construct } from 'constructs';
// import { DefaultStackSynthesizer } from 'aws-cdk-lib';
// import * as lambda from 'aws-cdk-lib/aws-lambda';
// import * as ecs from 'aws-cdk-lib/aws-ecs';
// import * as iam from 'aws-cdk-lib/aws-iam';
// import {
//   DockerImageFunction,
//   DockerImageCode,
//   FunctionUrlAuthType,
//   Architecture,
// } from 'aws-cdk-lib/aws-lambda';
// import { ManagedPolicy } from 'aws-cdk-lib/aws-iam';
// import { Bucket } from 'aws-cdk-lib/aws-s3';

// export class RagCdkInfraStack extends cdk.Stack {
//   constructor(scope: Construct, id: string, props?: cdk.StackProps) {
//     super(scope, id, props);

//     // Import the existing bucket
//     const existingBucket = Bucket.fromBucketName(this, 'ExistingBucket', 'cdk-hnb659fds-assets-975050337340-us-east-1');

//     const apiImageCode = DockerImageCode.fromImageAsset('../image', {
//       cmd: ['app_api_handler.handler'],
//       buildArgs: {
//         platform: 'linux/amd64',
//       },
//     });

//     const apiFunction = new DockerImageFunction(this, 'ApiFunc', {
//       code: apiImageCode,
//       memorySize: 256,
//       timeout: cdk.Duration.seconds(30),
//       architecture: Architecture.X86_64,
//     });

//     const functionUrl = apiFunction.addFunctionUrl({
//       authType: FunctionUrlAuthType.NONE,
//       cors: {
//         allowedMethods: [lambda.HttpMethod.ALL],
//         allowedHeaders: ['*'],
//         allowedOrigins: ['*'],
//       },
//     });

//     apiFunction.role?.addManagedPolicy(
//       ManagedPolicy.fromAwsManagedPolicyName('AmazonBedrockFullAccess')
//     );

//     new cdk.CfnOutput(this, 'FunctionUrl', {
//       value: functionUrl.url,
//     });

//     // Create a new ECS Task Definition
//     const taskDefinition = new ecs.TaskDefinition(this, 'TaskDef', {
//       compatibility: ecs.Compatibility.FARGATE,
//       cpu: '256',
//       memoryMiB: '512',
//     });

// //     // Add the specified IAM policy to the task role
// //     taskDefinition.addToTaskRolePolicy(
// //       new iam.PolicyStatement({
// //         resources: ["arn:aws:s3:::cdktoolkit-stagingbucket-*"],
// //         actions: ["s3:*Object", "s3:ListBucket", 's3:getBucketLocation'],
// //       })
// //     );
//   }
// }

// const app = new cdk.App();
// new RagCdkInfraStack(app, 'RagCdkInfraStack', {
//   env: {
//     account: '975050337340',
//     region: 'us-east-1',
//   },
//   synthesizer: new DefaultStackSynthesizer({
//     fileAssetsBucketName: 'cdk-hnb659fds-assets-975050337340-us-east-1',
//   }),
// });
