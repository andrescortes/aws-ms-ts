import { Construct } from 'constructs';
import { LambdaRestApi } from 'aws-cdk-lib/aws-apigateway';
import { IFunction } from 'aws-cdk-lib/aws-lambda';

interface SwnApiGatewayProps {
  productMicroservice: IFunction,
  basketMicroservice: IFunction
}

export class SwnApiGateway extends Construct {


  constructor(scope: Construct, id: string, props: SwnApiGatewayProps) {
    super(scope, id);
    // Product apiGateway
    this.createProductApi(props.productMicroservice);
    // Basket apiGateway
    this.createBasketApi(props.basketMicroservice);
  }

  private createProductApi(productMicroservice: IFunction) {
    // product microservices api gateway
    const apiGateway = new LambdaRestApi(this, 'productApi', {
      restApiName: 'Product Service ApiGateway',
      handler: productMicroservice,
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

  private createBasketApi(basketMicroservice: IFunction) {
    // Basket microservices api gateway
    // root name = basket

    // Get /basket
    // Post /basket

    // resource name = basket/{userName}
    // Get /basket/{userName}
    // Delete /basket/{userName}

    // POST /basket/checkout

    // basket microservices api gateway
    const apiGw = new LambdaRestApi(this, 'basketApi', {
      restApiName: 'Basket Service ApiGateway',
      handler: basketMicroservice,
      proxy: false,
    });

    const basket = apiGw.root.addResource('basket'); //basket
    basket.addMethod('GET'); //GET /basket
    basket.addMethod('POST'); //POST /basket

    const singleBasket = basket.addResource('{userName}'); //basket{id}
    singleBasket.addMethod('GET'); //GET /basket{id}
    singleBasket.addMethod('DELETE'); //DELETE /basket{id}

    const basketCheckout = basket.addResource('checkout');
    basketCheckout.addMethod('POST'); // POST /basket/checkout
    // expected request payload : { userName: swn }
  }
}
