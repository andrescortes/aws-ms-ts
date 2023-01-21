import { Construct } from 'constructs';
import { NodejsFunction, NodejsFunctionProps } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { join } from 'path';
import { ITable } from 'aws-cdk-lib/aws-dynamodb';

interface SwnMicroservicesProps {
  productTable: ITable;
  basketTable: ITable;
  orderTable: ITable;
}

export class SwnMicroservices extends Construct {

  public readonly productMicroservice: NodejsFunction;
  public readonly basketMicroservice: NodejsFunction;
  public readonly orderingMicroservice: NodejsFunction;

  constructor(scope: Construct, id: string, props: SwnMicroservicesProps) {
    super(scope, id);
    this.productMicroservice = this.createProductFunction(props.productTable);
    this.basketMicroservice = this.createBasketFunction(props.basketTable);
    this.orderingMicroservice = this.createOrderFunction(props.orderTable);
  }

  private createProductFunction(iTable: ITable): NodejsFunction {
    const nodeJsProps: NodejsFunctionProps = {
      bundling: {
        externalModules: [
          'awd-sdk',
        ],
      },
      environment: {
        PRIMARY_KEY: 'id',
        DYNAMODB_TABLE_NAME: iTable.tableName,
      },
      runtime: Runtime.NODEJS_14_X,
    }

    const productFunction = new NodejsFunction(this, 'productLambdaFunctions', {
      entry: join(__dirname, `/../src/product/index.js`),
      ...nodeJsProps,
    });

    iTable.grantReadWriteData(productFunction);

    return productFunction;
  }

  private createBasketFunction(iTable: ITable): NodejsFunction {
    const nodeJsProps: NodejsFunctionProps = {
      bundling: {
        externalModules: ["awd-sdk"],
      },
      environment: {
        PRIMARY_KEY: "userName",
        DYNAMODB_TABLE_NAME: iTable.tableName,
        EVENT_SOURCE: "com.swn.basket.checkoutbasket",
        EVENT_DETAILTYPE: "CheckoutBasket",
        EVENT_BUS_NAME: "SwnEventBus",
      },
      runtime: Runtime.NODEJS_14_X,
    };

    const basketFunction = new NodejsFunction(this, 'basketLambdaFunctions', {
      entry: join(__dirname, `/../src/basket/index.js`),
      ...nodeJsProps,
    });

    iTable.grantReadWriteData(basketFunction);

    return basketFunction;
  }

  createOrderFunction(orderTable: ITable): NodejsFunction {
    const nodeJsProps: NodejsFunctionProps = {
      bundling: {
        externalModules: [
          'awd-sdk',
        ],
      },
      environment: {
        PRIMARY_KEY: 'userName',
        SORT_KEY: 'orderDate',
        DYNAMODB_TABLE_NAME: orderTable.tableName,
      },
      runtime: Runtime.NODEJS_14_X,
    }

    const orderFunction = new NodejsFunction(this, 'orderingLambdaFunctions', {
      entry: join(__dirname, `/../src/ordering/index.js`),
      ...nodeJsProps,
    });

    orderTable.grantReadWriteData(orderFunction);

    return orderFunction;
  }
} 
