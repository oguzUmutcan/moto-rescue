package com.motorescue.auth;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest(properties = "firebase.enabled=false")
class AuthApplicationTests {

	@Test
	void contextLoads() {
	}

}
