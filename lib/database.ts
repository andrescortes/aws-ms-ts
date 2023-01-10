import { Construct } from 'constructs';
import { AttributeType, BillingMode, ITable, Table } from 'aws-cdk-lib/aws-dynamodb';
import { RemovalPolicy } from 'aws-cdk-lib';

export class SwnDatabase extends Construct {
  public readonly productTable: ITable;
  public readonly basketTable: ITable;

  constructor(scope: Construct, id: string) {
    super(scope, id);
    this.productTable = this.createProductTable();
    this.basketTable = this.createBasketTable();
  }

  private createProductTable(): ITable {
    return new Table(this, 'product', {
      partitionKey: {
        name: 'id',
        type: AttributeType.STRING,
      },
      tableName: 'product',
      removalPolicy: RemovalPolicy.DESTROY,
      billingMode: BillingMode.PAY_PER_REQUEST,
    });
  }

  // basket table
  // basket id-username - basketItemList[]
  // basket : PK : userName -- items (SET-MAP object)
  // item1 { quantity - color - price - productName}
  // item2 { quantity - color - price - productName}
  private createBasketTable(): ITable {
    return new Table(this, 'basket', {
      partitionKey: {
        name: 'userName',
        type: AttributeType.STRING,
      },
      tableName: 'basket',
      removalPolicy: RemovalPolicy.DESTROY,
      billingMode: BillingMode.PAY_PER_REQUEST,
    });
  }
}
