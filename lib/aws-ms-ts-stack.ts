import * as cdk from 'aws-cdk-lib';
import { RemovalPolicy } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Code, Function, Runtime } from 'aws-cdk-lib/aws-lambda';
import { AttributeType, BillingMode, Table } from 'aws-cdk-lib/aws-dynamodb';
import { join } from 'path'
import { NodejsFunction, NodejsFunctionProps } from 'aws-cdk-lib/aws-lambda-nodejs';
import { LambdaRestApi } from 'aws-cdk-lib/aws-apigateway';

export class AwsMsTsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const productTable = new Table(this, 'product', {
      partitionKey: {
        name: 'id',
        type: AttributeType.STRING,
      },
      tableName: 'product',
      removalPolicy: RemovalPolicy.DESTROY,
      billingMode: BillingMode.PAY_PER_REQUEST,
    });

    const fn = new Function(this, 'MyFunctionTs', {
      runtime: Runtime.NODEJS_14_X,
      handler: 'index.handler',
      code: Code.fromAsset(join(__dirname, 'lambda-handler')),
    });
    const nodeJsProps: NodejsFunctionProps = {
      bundling: {
        externalModules: [
          'awd-sdk',
        ],
      },
      environment: {
        PRIMARY_KEY: 'id',
        DYNAMODB_TABLE_NAME: productTable.tableName,
      },
      runtime: Runtime.NODEJS_14_X,
    }

    const productFunction = new NodejsFunction(this, 'productLambdaFunctions', {
      entry: join(__dirname, `/../src/product/index.js`),
      ...nodeJsProps,
    });
    //given permission to lambda function
    productTable.grantReadWriteData(productFunction);

    // product microservices api gateway

    const apiGateway = new LambdaRestApi(this, 'productApi', {
      restApiName: 'Product Service',
      handler: productFunction,
      proxy: false,
    });

    const product = apiGateway.root.addResource('product'); //product
    product.addMethod('GET'); //GET /product
    product.addMethod('POST'); //POST /product

    const singleProduct = product.addResource('{id}'); //product{id}
    singleProduct.addMethod('GET'); //GET /product{id}
    singleProduct.addMethod('PUT'); //PUT /product{id}
    singleProduct.addMethod('DELETE'); //DELETE /product{id}

  }
}
