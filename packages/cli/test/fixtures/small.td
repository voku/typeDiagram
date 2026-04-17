typeDiagram

  type User {
    id: UUID
    name: String
    email: Option<Email>
    roles: List<Role>
    address: Address
  }

  type Address {
    line1: String
    city: String
    country: CountryCode
  }

  union Shape {
    Circle   { radius: Float }
    Square   { side: Float }
    Triangle { a: Float, b: Float, c: Float }
  }

  union Option<T> {
    Some { value: T }
    None
  }

  alias Email = String
