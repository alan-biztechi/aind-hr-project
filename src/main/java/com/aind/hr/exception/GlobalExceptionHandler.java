package com.aind.hr.exception;

import com.aind.hr.model.response.ResultResponse;
import com.aind.hr.constant.SuccessFlag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(CustomException.class)
    public ResponseEntity<ResultResponse> handleCustomException(CustomException e) {
        ResultResponse body = new ResultResponse(SuccessFlag.NO, e.getMessage());
        return new ResponseEntity<>(body, e.getErrorCode().getHttpStatus());
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ResultResponse> handleException(Exception e) {
        ResultResponse body = new ResultResponse(SuccessFlag.NO, e.getMessage());
        return ResponseEntity.internalServerError().body(body);
    }
}
