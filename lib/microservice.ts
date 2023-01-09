import { Construct } from 'constructs';
import { NodejsFunction, NodejsFunctionProps } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { join } from 'path';
import { ITable } from 'aws-cdk-lib/aws-dynamodb';

interface SwnMicroservicesProps {
  productTable: ITable;
}

export class SwnMicroservices extends Construct {

  public readonly productMicroservice: NodejsFunction;

  constructor(scope: Construct, id: string, props: SwnMicroservicesProps) {
    super(scope, id);
    const nodeJsProps: NodejsFunctionProps = {
      bundling: {
        externalModules: [
          'awd-sdk',
        ],
      },
      environment: {
        PRIMARY_KEY: 'id',
        DYNAMODB_TABLE_NAME: props.productTable.tableName,
      },
      runtime: Runtime.NODEJS_14_X,
    }

    const productFunction = new NodejsFunction(this, 'productLambdaFunctions', {
      entry: join(__dirname, `/../src/product/index.js`),
      ...nodeJsProps,
    });
    props.productTable.grantReadWriteData(productFunction);

    this.productMicroservice = productFunction;
  }
}