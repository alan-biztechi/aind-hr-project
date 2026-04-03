package com.aind.hr.constant;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

@Getter
@RequiredArgsConstructor
public enum ErrorCode {

    DEPARTMENT_NOT_FOUND(HttpStatus.NOT_FOUND, "부서를 찾을 수 없습니다."),
    EMPLOYEE_NOT_FOUND(HttpStatus.NOT_FOUND, "직원을 찾을 수 없습니다."),
    ATTENDANCE_NOT_FOUND(HttpStatus.NOT_FOUND, "출퇴근 기록을 찾을 수 없습니다."),
    LEAVE_REQUEST_NOT_FOUND(HttpStatus.NOT_FOUND, "휴가 신청을 찾을 수 없습니다."),

    DEPARTMENT_CREATION_FAILED(HttpStatus.INTERNAL_SERVER_ERROR, "부서 생성에 실패했습니다."),
    EMPLOYEE_CREATION_FAILED(HttpStatus.INTERNAL_SERVER_ERROR, "직원 등록에 실패했습니다."),
    ATTENDANCE_CREATION_FAILED(HttpStatus.INTERNAL_SERVER_ERROR, "출퇴근 기록 등록에 실패했습니다."),
    LEAVE_REQUEST_CREATION_FAILED(HttpStatus.INTERNAL_SERVER_ERROR, "휴가 신청에 실패했습니다."),

    DUPLICATE_ATTENDANCE(HttpStatus.CONFLICT, "해당 날짜에 이미 출퇴근 기록이 있습니다."),
    INVALID_INPUT(HttpStatus.BAD_REQUEST, "입력값이 올바르지 않습니다.");

    private final HttpStatus httpStatus;
    private final String message;
}
