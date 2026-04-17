typeDiagram

type User {
  name: String
  email: String
  address: Address
}

type Address {
  line1: String
  city: String
  country: String
}

union Shape {
  Circle
  Square
  Triangle
}
